import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { env } from "../../../core/config/env.config";
import { JwtPayload } from "../../identity/infrastructure/jwt.strategy";
import { QuizService } from "../application/services/quiz.service";
import { AnswerQuizDto, JoinQuizDto } from "../application/dto/join-quiz.dto";
import {
  QUIZ_ANSWER_GRACE_MS,
  QUIZ_OPTION_COUNT,
  QuizErrorCode,
  QuizEvent,
  QuizStatus,
} from "../config/quiz.enums";
import { QuizPlayer, QuizQuestion, QuizStatePayload } from "../application/types/quiz.types";

interface QuizRuntime {
  hostId: string;
  questions: QuizQuestion[];
  status: QuizStatus;
  index: number;
  players: Map<string, QuizPlayer>;
  hostSockets: Set<string>;
  answered: Set<string>;
  counts: number[];
  startedAt: number;
  deadline: number;
  revealed: boolean;
  timer: NodeJS.Timeout | null;
}

interface SocketData {
  userId: string;
  sessionId: string;
  isHost: boolean;
}

@WebSocketGateway({
  namespace: "/quiz",
  cors: { origin: env.server.webOrigins, credentials: true },
})
export class QuizGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(QuizGateway.name);
  private readonly runtimes = new Map<string, QuizRuntime>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly quizService: QuizService,
  ) {}

  handleDisconnect(client: Socket): void {
    const data = client.data as Partial<SocketData>;
    if (!data?.sessionId) return;
    this.runtimes.get(data.sessionId)?.hostSockets.delete(client.id);
  }

  @SubscribeMessage(QuizEvent.JOIN)
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: JoinQuizDto): Promise<void> {
    const userId = this.verify(String(body?.token ?? ""));
    if (!userId) return this.fail(client, QuizErrorCode.UNAUTHORIZED);

    try {
      const access = await this.quizService.access(String(body?.pin ?? ""), userId);
      const session = await this.quizService.byId(access.session_id);
      const runtime = this.runtime(session.id, {
        hostId: session.teacher_id,
        questions: session.questions,
        status: session.status,
        index: session.current_index,
      });

      if (!runtime.questions.length) runtime.questions = session.questions;

      client.data = { userId, sessionId: session.id, isHost: access.is_host } satisfies SocketData;
      await client.join(this.room(session.id));

      if (access.is_host) {
        runtime.hostSockets.add(client.id);
      } else if (!runtime.players.has(userId)) {
        const totals = await this.quizService.studentTotals(session.id, userId);
        runtime.players.set(userId, {
          id: userId,
          name: access.name,
          score: totals.score,
          correct: totals.correct,
        });
      }

      if (runtime.status === QuizStatus.ENDED) {
        client.emit(QuizEvent.ENDED, { results: await this.quizService.buildResults(session) });
        return;
      }

      this.broadcastState(session.id);
      this.broadcastLeaderboard(session.id);
      if (access.is_host) this.sendDistribution(session.id);
    } catch (error) {
      this.fail(client, this.codeOf(error));
    }
  }

  @SubscribeMessage(QuizEvent.NEXT)
  async next(@ConnectedSocket() client: Socket): Promise<void> {
    const data = client.data as Partial<SocketData>;
    if (!data?.sessionId || !data.isHost) return this.fail(client, QuizErrorCode.FORBIDDEN);

    const runtime = this.runtimes.get(data.sessionId);
    if (!runtime) return this.fail(client, QuizErrorCode.QUIZ_NOT_FOUND);

    try {
      const session = await this.quizService.requireHost(data.sessionId, data.userId as string);
      if (session.status === QuizStatus.ENDED) return this.fail(client, QuizErrorCode.QUIZ_ENDED);

      if (!runtime.questions.length) {
        runtime.questions = session.questions;
        if (!runtime.questions.length) return this.fail(client, QuizErrorCode.QUIZ_NOT_READY);
        this.broadcastState(session.id);
      }

      const target = session.status === QuizStatus.LOBBY ? 0 : session.current_index + 1;
      if (target >= runtime.questions.length) {
        await this.endSession(data.sessionId, data.userId as string);
        return;
      }

      await this.quizService.advance(session.id, target);

      const question = runtime.questions[target];
      this.clearTimer(runtime);
      runtime.status = QuizStatus.RUNNING;
      runtime.index = target;
      runtime.answered.clear();
      runtime.counts = new Array(QUIZ_OPTION_COUNT).fill(0);
      runtime.revealed = false;
      runtime.startedAt = Date.now();
      runtime.deadline = runtime.startedAt + question.seconds * 1000;
      runtime.timer = setTimeout(() => this.reveal(session.id), question.seconds * 1000);

      this.broadcastState(session.id);
      this.broadcastLeaderboard(session.id);
      this.sendDistribution(session.id);
    } catch (error) {
      this.fail(client, this.codeOf(error));
    }
  }

  @SubscribeMessage(QuizEvent.ANSWER)
  async answer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: AnswerQuizDto,
  ): Promise<void> {
    const data = client.data as Partial<SocketData>;
    if (!data?.sessionId || data.isHost) return;

    const runtime = this.runtimes.get(data.sessionId);
    const userId = data.userId as string;
    if (!runtime || runtime.status !== QuizStatus.RUNNING || runtime.revealed) return;
    if (!runtime.players.has(userId) || runtime.answered.has(userId)) return;

    const optionIndex = Number(body?.option_index);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= QUIZ_OPTION_COUNT) {
      return;
    }

    const question = runtime.questions[runtime.index];
    if (!question) return;

    const elapsed = Date.now() - runtime.startedAt;
    if (elapsed > question.seconds * 1000 + QUIZ_ANSWER_GRACE_MS) return;

    const outcome = await this.quizService.recordAnswer(
      data.sessionId,
      userId,
      runtime.index,
      optionIndex,
      question,
      elapsed,
    );

    runtime.answered.add(userId);
    runtime.counts[optionIndex] += 1;

    const player = runtime.players.get(userId);
    if (player) {
      player.score += outcome.score;
      player.correct += outcome.correct ? 1 : 0;
    }

    client.emit(QuizEvent.RESULT, outcome);
    this.server
      .to(this.room(data.sessionId))
      .emit(QuizEvent.ANSWERED, { answered: runtime.answered.size, total: runtime.players.size });
    this.sendDistribution(data.sessionId);
    this.broadcastLeaderboard(data.sessionId);

    if (runtime.answered.size >= runtime.players.size) this.reveal(data.sessionId);
  }

  @SubscribeMessage(QuizEvent.FINISH)
  async finish(@ConnectedSocket() client: Socket): Promise<void> {
    const data = client.data as Partial<SocketData>;
    if (!data?.sessionId || !data.isHost) return this.fail(client, QuizErrorCode.FORBIDDEN);

    try {
      await this.endSession(data.sessionId, data.userId as string);
    } catch (error) {
      this.fail(client, this.codeOf(error));
    }
  }

  private async endSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.quizService.requireHost(sessionId, userId);
    await this.quizService.finish(sessionId);

    const runtime = this.runtimes.get(sessionId);
    if (runtime) {
      this.clearTimer(runtime);
      runtime.status = QuizStatus.ENDED;
      runtime.revealed = true;
    }

    session.status = QuizStatus.ENDED;
    const results = await this.quizService.buildResults(session);

    this.broadcastState(sessionId);
    this.server.to(this.room(sessionId)).emit(QuizEvent.ENDED, { results });
    this.runtimes.delete(sessionId);
  }

  private reveal(sessionId: string): void {
    const runtime = this.runtimes.get(sessionId);
    if (!runtime || runtime.revealed) return;

    this.clearTimer(runtime);
    runtime.revealed = true;

    const question = runtime.questions[runtime.index];
    this.server.to(this.room(sessionId)).emit(QuizEvent.REVEAL, {
      index: runtime.index,
      correct_index: question?.correct_index ?? -1,
      counts: [...runtime.counts],
    });
    this.broadcastLeaderboard(sessionId);
  }

  private broadcastState(sessionId: string): void {
    const runtime = this.runtimes.get(sessionId);
    if (!runtime) return;

    const question =
      runtime.status === QuizStatus.RUNNING ? runtime.questions[runtime.index] : undefined;

    const payload: QuizStatePayload = {
      status: runtime.status,
      index: runtime.index,
      total: runtime.questions.length,
      question: question
        ? { text: question.text, options: question.options, seconds: question.seconds }
        : null,
      deadline: question ? runtime.deadline : 0,
      players: this.sortedPlayers(runtime),
    };

    this.server.to(this.room(sessionId)).emit(QuizEvent.STATE, payload);
  }

  private broadcastLeaderboard(sessionId: string): void {
    const runtime = this.runtimes.get(sessionId);
    if (!runtime) return;
    this.server
      .to(this.room(sessionId))
      .emit(QuizEvent.LEADERBOARD, { rows: this.sortedPlayers(runtime) });
  }

  private sendDistribution(sessionId: string): void {
    const runtime = this.runtimes.get(sessionId);
    if (!runtime) return;
    for (const socketId of runtime.hostSockets) {
      this.server.to(socketId).emit(QuizEvent.DISTRIBUTION, {
        index: runtime.index,
        counts: [...runtime.counts],
        answered: runtime.answered.size,
        total: runtime.players.size,
      });
    }
  }

  private sortedPlayers(runtime: QuizRuntime): QuizPlayer[] {
    return [...runtime.players.values()].sort((a, b) => b.score - a.score);
  }

  private runtime(
    sessionId: string,
    seed: { hostId: string; questions: QuizQuestion[]; status: QuizStatus; index: number },
  ): QuizRuntime {
    const existing = this.runtimes.get(sessionId);
    if (existing) return existing;

    const created: QuizRuntime = {
      hostId: seed.hostId,
      questions: seed.questions,
      status: seed.status,
      index: seed.index,
      players: new Map(),
      hostSockets: new Set(),
      answered: new Set(),
      counts: new Array(QUIZ_OPTION_COUNT).fill(0),
      startedAt: 0,
      deadline: 0,
      revealed: seed.status !== QuizStatus.RUNNING,
      timer: null,
    };
    this.runtimes.set(sessionId, created);
    return created;
  }

  private clearTimer(runtime: QuizRuntime): void {
    if (!runtime.timer) return;
    clearTimeout(runtime.timer);
    runtime.timer = null;
  }

  private verify(token: string): string | null {
    try {
      return this.jwtService.verify<JwtPayload>(token).sub;
    } catch {
      return null;
    }
  }

  private room(sessionId: string): string {
    return `quiz:${sessionId}`;
  }

  private codeOf(error: unknown): QuizErrorCode {
    const response = (error as { response?: { message?: string } })?.response?.message;
    const message = response ?? (error as Error)?.message ?? "";
    const known = Object.values(QuizErrorCode).find((code) => code === message);
    if (!known) this.logger.warn(`quiz join failed: ${message}`);
    return known ?? QuizErrorCode.JOIN_FAILED;
  }

  private fail(client: Socket, code: QuizErrorCode): void {
    client.emit(QuizEvent.ERROR, { code });
  }
}

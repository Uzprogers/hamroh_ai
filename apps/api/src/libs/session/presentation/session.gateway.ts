import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { env } from "../../../core/config/env.config";
import { Role } from "../../identity/config/identity.enums";
import { JwtPayload } from "../../identity/infrastructure/jwt.strategy";
import { LlmService } from "../../agent/infrastructure/llm.service";
import { YandexSttService } from "../../speech/infrastructure/yandex-stt.service";
import { YandexTtsService } from "../../speech/infrastructure/yandex-tts.service";
import { SessionPipeline } from "../application/session-pipeline";
import { SessionService } from "../application/services/session.service";
import { ToolsService } from "../application/services/tools.service";
import { MessageSender, SessionState } from "../config/session.enums";

interface LiveSession {
  studentId: string;
  sessionId: string;
  pipeline: SessionPipeline;
}

@WebSocketGateway({
  namespace: "/session",
  cors: { origin: env.server.webOrigins, credentials: true },
  maxHttpBufferSize: 5e6,
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SessionGateway.name);
  private readonly live = new Map<string, LiveSession>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly toolsService: ToolsService,
    private readonly stt: YandexSttService,
    private readonly tts: YandexTtsService,
    private readonly ai: LlmService,
  ) {}

  handleConnection(client: Socket): void {
    const token = (client.handshake.auth?.token as string) || "";
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.role !== Role.STUDENT) {
        client.emit("session:error", { message: "ONLY_STUDENTS" });
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
    } catch {
      client.emit("session:error", { message: "UNAUTHORIZED" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const session = this.live.get(client.id);
    if (!session) return;
    session.pipeline.dispose();
    void this.sessionService.close(session.sessionId);
    this.live.delete(client.id);
  }

  @SubscribeMessage("session:start")
  async start(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { lesson_id?: string },
  ): Promise<void> {
    const studentId = client.data.userId as string;
    if (!studentId || this.live.has(client.id)) return;

    try {
      const context = await this.sessionService.studentContext(studentId);
      const session = await this.sessionService.open(studentId, body?.lesson_id ?? null);

      const pipeline = new SessionPipeline(
        context,
        { stt: this.stt, tts: this.tts, ai: this.ai, tools: this.toolsService },
        {
          state: (state) => client.emit("state", { state }),
          transcript: (text) => client.emit("transcript", { text }),
          reply: (text) => client.emit("reply", { text }),
          audio: (pcm) => client.emit("audio", pcm),
          toolPending: (callId, tool) => client.emit("panel:pending", { call_id: callId, tool }),
          toolReady: (callId, tool, card) =>
            client.emit("panel:ready", { call_id: callId, tool, card }),
          failure: (message) => client.emit("session:error", { message }),
          persist: (sender: MessageSender, text, toolName, toolResult) =>
            void this.sessionService.record(session.id, sender, text, toolName, toolResult),
        },
      );

      this.live.set(client.id, { studentId, sessionId: session.id, pipeline });
      client.emit("session:ready", { session_id: session.id, locale: context.locale });
      client.emit("state", { state: SessionState.THINKING });

      await pipeline.openingTurn();
    } catch (err) {
      this.logger.error(`session:start failed: ${(err as Error).message}`);
      client.emit("session:error", { message: "SESSION_START_FAILED" });
    }
  }

  @SubscribeMessage("audio:chunk")
  audioChunk(@ConnectedSocket() client: Socket, @MessageBody() chunk: ArrayBuffer): void {
    this.live.get(client.id)?.pipeline.feedAudio(Buffer.from(chunk));
  }

  @SubscribeMessage("audio:end")
  async audioEnd(@ConnectedSocket() client: Socket): Promise<void> {
    await this.live.get(client.id)?.pipeline.endAudio();
  }

  @SubscribeMessage("text")
  async text(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ): Promise<void> {
    const text = String(body?.text ?? "").slice(0, 2000);
    await this.live.get(client.id)?.pipeline.handleText(text);
  }

  @SubscribeMessage("session:end")
  async end(@ConnectedSocket() client: Socket): Promise<void> {
    this.handleDisconnect(client);
    client.emit("session:closed", {});
  }

  afterInit(_server: Server): void {
    this.logger.log("Session gateway ready on /session");
  }
}

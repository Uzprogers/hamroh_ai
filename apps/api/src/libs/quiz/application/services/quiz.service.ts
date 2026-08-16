import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { QuizSessionOrmEntity } from "../../infrastructure/typeorm/quiz-session.orm-entity";
import { QuizAnswerOrmEntity } from "../../infrastructure/typeorm/quiz-answer.orm-entity";
import { LessonOrmEntity } from "../../../education/infrastructure/typeorm/lesson.orm-entity";
import { AssignmentOrmEntity } from "../../../education/infrastructure/typeorm/assignment.orm-entity";
import { GroupOrmEntity } from "../../../education/infrastructure/typeorm/group.orm-entity";
import { GroupMemberOrmEntity } from "../../../education/infrastructure/typeorm/group-member.orm-entity";
import { UserOrmEntity } from "../../../identity/infrastructure/typeorm/user.orm-entity";
import { LlmService } from "../../../agent/infrastructure/llm.service";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";
import { QUIZ_SYSTEM_PROMPT, buildQuizPrompt } from "../quiz-prompt";
import {
  QUIZ_ANSWER_GRACE_MS,
  QUIZ_DEFAULT_SECONDS,
  QUIZ_MAX_SCORE,
  QUIZ_MAX_SECONDS,
  QUIZ_MIN_SECONDS,
  QUIZ_OPTION_COUNT,
  QUIZ_PIN_ATTEMPTS,
  QUIZ_PIN_LENGTH,
  QUIZ_SPEED_WEIGHT,
  QuizErrorCode,
  QuizGeneration,
  QuizStatus,
} from "../../config/quiz.enums";
import {
  AnswerOutcome,
  GeneratedQuiz,
  LeaderboardRow,
  QuestionStat,
  QuizAccess,
  QuizQuestion,
  QuizResults,
  QuizSummary,
} from "../types/quiz.types";

interface LeaderboardRaw {
  student_id: string;
  first_name: string;
  last_name: string | null;
  score: string;
  correct: string;
  avg_ms: string;
}

interface QuestionStatRaw {
  question_index: string;
  correct_count: string;
  total_count: string;
  avg_ms: string;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectRepository(QuizSessionOrmEntity)
    private readonly sessionRepo: Repository<QuizSessionOrmEntity>,
    @InjectRepository(QuizAnswerOrmEntity)
    private readonly answerRepo: Repository<QuizAnswerOrmEntity>,
    @InjectRepository(LessonOrmEntity)
    private readonly lessonRepo: Repository<LessonOrmEntity>,
    @InjectRepository(AssignmentOrmEntity)
    private readonly assignmentRepo: Repository<AssignmentOrmEntity>,
    @InjectRepository(GroupOrmEntity)
    private readonly groupRepo: Repository<GroupOrmEntity>,
    @InjectRepository(GroupMemberOrmEntity)
    private readonly memberRepo: Repository<GroupMemberOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    private readonly ai: LlmService,
  ) {}

  async createSession(teacherId: string, locale: Locale, lessonId: string): Promise<QuizSummary> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (lesson.teacher_id !== teacherId) throw new ForbiddenException("NOT_LESSON_OWNER");

    const open = await this.sessionRepo.findOne({
      where: { lesson_id: lesson.id, teacher_id: teacherId, status: Not(QuizStatus.ENDED) },
      order: { created_at: "DESC" },
    });
    if (open) {
      if (open.generation === QuizGeneration.FAILED) void this.generate(open.id, locale, lesson);
      return this.toSummary(open, lesson.topic);
    }

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        lesson_id: lesson.id,
        teacher_id: teacherId,
        pin: await this.uniquePin(),
        status: QuizStatus.LOBBY,
        questions: [],
        generation: QuizGeneration.PENDING,
        current_index: 0,
      }),
    );

    void this.generate(session.id, locale, lesson);

    return this.toSummary(session, lesson.topic);
  }

  private async generate(
    sessionId: string,
    locale: Locale,
    lesson: LessonOrmEntity,
  ): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { generation: QuizGeneration.PENDING, questions: [] },
    );

    try {
      const group = await this.groupRepo.findOne({ where: { id: lesson.group_id } });
      const assignments = await this.assignmentRepo.find({
        where: { lesson_id: lesson.id },
        order: { order_index: "ASC" },
      });

      const generated = await this.ai.json<GeneratedQuiz>(
        `${QUIZ_SYSTEM_PROMPT}\n\n${LANGUAGE_INSTRUCTION[locale]}`,
        buildQuizPrompt({
          subject: group?.subject ?? lesson.topic,
          topic: lesson.topic,
          objective: lesson.objective,
          materials: assignments.flatMap((assignment) =>
            [assignment.question, assignment.expected_answer].filter(
              (text): text is string => Boolean(text) && String(text).trim().length > 0,
            ),
          ),
        }),
        { fast: true },
      );

      const questions = this.normalize(generated?.questions ?? []);
      if (!questions.length) throw new BadRequestException("QUIZ_NO_QUESTIONS");

      await this.sessionRepo.update(
        { id: sessionId },
        { questions, generation: QuizGeneration.READY },
      );
    } catch (error) {
      this.logger.error(`quiz generation failed: ${(error as Error)?.message ?? error}`);
      await this.sessionRepo.update({ id: sessionId }, { generation: QuizGeneration.FAILED });
    }
  }

  async summaryByPin(pin: string, userId: string): Promise<QuizSummary> {
    const session = await this.requireByPin(pin);
    await this.requireAccess(session, userId);
    const lesson = await this.lessonRepo.findOne({ where: { id: session.lesson_id } });
    return this.toSummary(session, lesson?.topic ?? "");
  }

  async access(pin: string, userId: string): Promise<QuizAccess> {
    const session = await this.requireByPin(pin);
    const user = await this.requireAccess(session, userId);
    return {
      session_id: session.id,
      is_host: session.teacher_id === userId,
      name: this.displayName(user),
    };
  }

  async byId(sessionId: string): Promise<QuizSessionOrmEntity> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(QuizErrorCode.QUIZ_NOT_FOUND);
    return session;
  }

  async requireHost(sessionId: string, userId: string): Promise<QuizSessionOrmEntity> {
    const session = await this.byId(sessionId);
    if (session.teacher_id !== userId) throw new ForbiddenException(QuizErrorCode.FORBIDDEN);
    return session;
  }

  async advance(sessionId: string, index: number): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { status: QuizStatus.RUNNING, current_index: index },
    );
    await this.sessionRepo
      .createQueryBuilder()
      .update(QuizSessionOrmEntity)
      .set({ started_at: () => "now()" })
      .where("id = :id", { id: sessionId })
      .andWhere("started_at IS NULL")
      .execute();
  }

  async finish(sessionId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { status: QuizStatus.ENDED, ended_at: new Date() },
    );
  }

  scoreFor(correct: boolean, elapsedMs: number, seconds: number): number {
    if (!correct) return 0;
    const limit = Math.max(1, seconds) * 1000;
    const elapsed = Math.min(Math.max(elapsedMs, 0), limit);
    return Math.round(QUIZ_MAX_SCORE * (1 - QUIZ_SPEED_WEIGHT * (elapsed / limit)));
  }

  async recordAnswer(
    sessionId: string,
    studentId: string,
    questionIndex: number,
    optionIndex: number,
    question: QuizQuestion,
    elapsedMs: number,
  ): Promise<AnswerOutcome> {
    const limit = question.seconds * 1000 + QUIZ_ANSWER_GRACE_MS;
    const elapsed = Math.min(Math.max(Math.round(elapsedMs), 0), limit);
    const correct = optionIndex === question.correct_index;
    const score = this.scoreFor(correct, elapsed, question.seconds);

    await this.answerRepo
      .createQueryBuilder()
      .insert()
      .into(QuizAnswerOrmEntity)
      .values({
        session_id: sessionId,
        student_id: studentId,
        question_index: questionIndex,
        option_index: optionIndex,
        correct,
        elapsed_ms: elapsed,
        score,
      })
      .orIgnore()
      .execute();

    return { correct, score, correct_index: question.correct_index };
  }

  async studentTotals(
    sessionId: string,
    studentId: string,
  ): Promise<{ score: number; correct: number }> {
    const raw = await this.answerRepo
      .createQueryBuilder("a")
      .select("COALESCE(SUM(a.score), 0)", "score")
      .addSelect("COUNT(*) FILTER (WHERE a.correct)", "correct")
      .where("a.session_id = :sessionId", { sessionId })
      .andWhere("a.student_id = :studentId", { studentId })
      .getRawOne<{ score: string; correct: string }>();

    return { score: Number(raw?.score ?? 0), correct: Number(raw?.correct ?? 0) };
  }

  async results(sessionId: string, teacherId: string): Promise<QuizResults> {
    const session = await this.requireHost(sessionId, teacherId);
    return this.buildResults(session);
  }

  async buildResults(session: QuizSessionOrmEntity): Promise<QuizResults> {
    const total = session.questions.length;

    const leaderRaw = await this.answerRepo
      .createQueryBuilder("a")
      .innerJoin(UserOrmEntity, "u", "u.id = a.student_id")
      .select("a.student_id", "student_id")
      .addSelect("u.first_name", "first_name")
      .addSelect("u.last_name", "last_name")
      .addSelect("COALESCE(SUM(a.score), 0)", "score")
      .addSelect("COUNT(*) FILTER (WHERE a.correct)", "correct")
      .addSelect("COALESCE(AVG(a.elapsed_ms), 0)", "avg_ms")
      .where("a.session_id = :sessionId", { sessionId: session.id })
      .groupBy("a.student_id")
      .addGroupBy("u.first_name")
      .addGroupBy("u.last_name")
      .orderBy("COALESCE(SUM(a.score), 0)", "DESC")
      .getRawMany<LeaderboardRaw>();

    const leaderboard: LeaderboardRow[] = leaderRaw.map((row) => ({
      student_id: row.student_id,
      name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
      score: Number(row.score),
      correct: Number(row.correct),
      total,
      avg_ms: Math.round(Number(row.avg_ms)),
    }));

    const statRaw = await this.answerRepo
      .createQueryBuilder("a")
      .select("a.question_index", "question_index")
      .addSelect("COUNT(*) FILTER (WHERE a.correct)", "correct_count")
      .addSelect("COUNT(*)", "total_count")
      .addSelect("COALESCE(AVG(a.elapsed_ms), 0)", "avg_ms")
      .where("a.session_id = :sessionId", { sessionId: session.id })
      .groupBy("a.question_index")
      .getRawMany<QuestionStatRaw>();

    const byIndex = new Map(statRaw.map((row) => [Number(row.question_index), row]));

    const questions: QuestionStat[] = session.questions.map((question, index) => {
      const row = byIndex.get(index);
      const totalCount = Number(row?.total_count ?? 0);
      const correctCount = Number(row?.correct_count ?? 0);
      return {
        index,
        text: question.text,
        correct_index: question.correct_index,
        correct_count: correctCount,
        wrong_count: Math.max(0, totalCount - correctCount),
        avg_ms: Math.round(Number(row?.avg_ms ?? 0)),
      };
    });

    return { leaderboard, questions };
  }

  private async requireByPin(pin: string): Promise<QuizSessionOrmEntity> {
    const clean = String(pin ?? "").trim();
    if (!/^\d{6}$/.test(clean)) throw new BadRequestException(QuizErrorCode.INVALID_PIN);

    const session = await this.sessionRepo.findOne({ where: { pin: clean } });
    if (!session) throw new NotFoundException(QuizErrorCode.QUIZ_NOT_FOUND);
    return session;
  }

  private async requireAccess(
    session: QuizSessionOrmEntity,
    userId: string,
  ): Promise<UserOrmEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException(QuizErrorCode.UNAUTHORIZED);
    if (session.teacher_id === user.id) return user;

    const member = await this.memberRepo
      .createQueryBuilder("m")
      .innerJoin(LessonOrmEntity, "l", "l.group_id = m.group_id")
      .where("l.id = :lessonId", { lessonId: session.lesson_id })
      .andWhere("m.student_id = :studentId", { studentId: user.id })
      .getCount();

    if (!member) throw new ForbiddenException(QuizErrorCode.NOT_GROUP_MEMBER);
    return user;
  }

  private toSummary(session: QuizSessionOrmEntity, topic: string): QuizSummary {
    return {
      id: session.id,
      pin: session.pin,
      status: session.status,
      lesson_topic: topic,
      questions_count: session.questions.length,
      generation: session.generation ?? QuizGeneration.READY,
    };
  }

  private displayName(user: UserOrmEntity): string {
    return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  }

  private normalize(questions: QuizQuestion[]): QuizQuestion[] {
    return questions
      .filter(
        (question) =>
          typeof question?.text === "string" &&
          question.text.trim().length > 0 &&
          Array.isArray(question.options) &&
          question.options.length === QUIZ_OPTION_COUNT &&
          question.options.every((option) => typeof option === "string" && option.trim().length) &&
          Number.isInteger(question.correct_index) &&
          question.correct_index >= 0 &&
          question.correct_index < QUIZ_OPTION_COUNT,
      )
      .map((question) => ({
        text: question.text.trim(),
        options: question.options.map((option) => option.trim()),
        correct_index: question.correct_index,
        seconds: this.clampSeconds(question.seconds),
      }));
  }

  private clampSeconds(seconds: number): number {
    if (!Number.isFinite(seconds)) return QUIZ_DEFAULT_SECONDS;
    return Math.min(QUIZ_MAX_SECONDS, Math.max(QUIZ_MIN_SECONDS, Math.round(seconds)));
  }

  private async uniquePin(): Promise<string> {
    for (let attempt = 0; attempt < QUIZ_PIN_ATTEMPTS; attempt += 1) {
      const pin = String(Math.floor(Math.random() * 10 ** QUIZ_PIN_LENGTH)).padStart(
        QUIZ_PIN_LENGTH,
        "0",
      );
      const taken = await this.sessionRepo.exists({ where: { pin } });
      if (!taken) return pin;
    }
    throw new BadRequestException("QUIZ_PIN_UNAVAILABLE");
  }
}

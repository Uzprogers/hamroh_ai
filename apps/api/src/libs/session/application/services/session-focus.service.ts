import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonOrmEntity } from "../../../education/infrastructure/typeorm/lesson.orm-entity";
import { GroupOrmEntity } from "../../../education/infrastructure/typeorm/group.orm-entity";
import { UserOrmEntity } from "../../../identity/infrastructure/typeorm/user.orm-entity";
import { GroupService } from "../../../education/application/services/group.service";
import { ResultsService } from "../../../education/application/services/results.service";
import { QuizService } from "../../../quiz/application/services/quiz.service";
import { SessionFocusKind } from "../../config/session.enums";
import {
  FocusHeadline,
  FocusRequest,
  LessonFocus,
  QuizFocus,
  SessionFocus,
} from "../types/session-focus.types";

@Injectable()
export class SessionFocusService {
  constructor(
    @InjectRepository(LessonOrmEntity) private readonly lessonRepo: Repository<LessonOrmEntity>,
    @InjectRepository(GroupOrmEntity) private readonly groupRepo: Repository<GroupOrmEntity>,
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
    private readonly groupService: GroupService,
    private readonly resultsService: ResultsService,
    private readonly quizService: QuizService,
  ) {}

  async resolve(studentId: string, request: FocusRequest): Promise<SessionFocus | null> {
    if (request?.quiz_session_id) return this.quizFocus(studentId, request.quiz_session_id);
    if (request?.lesson_id) return this.lessonFocus(studentId, request.lesson_id);
    return null;
  }

  headline(focus: SessionFocus | null): FocusHeadline | null {
    if (!focus) return null;

    return {
      kind: focus.kind,
      title: focus.topic,
      subject: focus.subject,
      group_name: focus.group_name,
      teacher_name: focus.teacher_name,
      detail:
        focus.kind === SessionFocusKind.QUIZ
          ? `${focus.correct}/${focus.total}`
          : focus.objective,
    };
  }

  private async lessonFocus(studentId: string, lessonId: string): Promise<LessonFocus> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");

    await this.groupService.assertMembership(studentId, lesson.group_id);

    const [group, teacher, results] = await Promise.all([
      this.groupRepo.findOne({ where: { id: lesson.group_id } }),
      this.userRepo.findOne({ where: { id: lesson.teacher_id } }),
      this.resultsService.lessonResults(studentId, lesson.id),
    ]);

    return {
      kind: SessionFocusKind.LESSON,
      id: lesson.id,
      topic: lesson.topic,
      objective: lesson.objective ?? "",
      subject: group?.subject ?? "",
      group_name: group?.name ?? "",
      teacher_name: this.displayName(teacher),
      plan: (lesson.plan ?? []).map((step) => `${step.title}: ${step.description}`),
      work: results.map((result) => ({
        question: result.question,
        answer: result.answer,
        score: result.score,
        max_score: result.max_score,
        feedback: result.feedback,
        mistakes: result.mistakes.map((mistake) => ({
          fragment: mistake.fragment,
          correction: mistake.correction,
          explanation: mistake.explanation,
        })),
      })),
    };
  }

  private async quizFocus(studentId: string, sessionId: string): Promise<QuizFocus> {
    const report = await this.quizService.report(sessionId, studentId);
    const quiz = await this.quizService.byId(sessionId);
    const teacher = await this.userRepo.findOne({ where: { id: quiz.teacher_id } });

    return {
      kind: SessionFocusKind.QUIZ,
      id: report.attempt.session_id,
      pin: report.attempt.pin,
      topic: report.attempt.lesson_topic,
      subject: report.attempt.subject,
      group_name: report.attempt.group_name,
      teacher_name: this.displayName(teacher),
      score: report.attempt.score,
      correct: report.attempt.correct,
      total: report.attempt.total,
      rank: report.attempt.rank,
      players: report.attempt.players,
      misses: report.answers
        .filter((answer) => !answer.correct)
        .map((answer) => ({
          question: answer.text,
          chosen: answer.chosen_index === null ? null : answer.options[answer.chosen_index],
          correct: answer.options[answer.correct_index],
        })),
    };
  }

  private displayName(user: UserOrmEntity | null): string {
    if (!user) return "";
    return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  }
}

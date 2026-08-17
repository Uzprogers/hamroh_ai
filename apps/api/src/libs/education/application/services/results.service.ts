import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubmissionOrmEntity } from "../../infrastructure/typeorm/submission.orm-entity";
import { LessonOrmEntity } from "../../infrastructure/typeorm/lesson.orm-entity";
import { CriterionResult, MistakeItem } from "../../infrastructure/typeorm/grade.orm-entity";
import { GroupService } from "./group.service";

export interface StudentResult {
  submission_id: string;
  lesson_topic: string;
  subject: string;
  assignment_id: string;
  question: string;
  type: string;
  answer: string | null;
  score: number | null;
  max_score: number;
  feedback: string | null;
  mistakes: MistakeItem[];
  criteria_results: CriterionResult[];
  teacher_approved: boolean;
  submitted_at: Date;
}

export interface GroupSummaryRow {
  student_id: string;
  first_name: string;
  last_name: string;
  submissions: number;
  average_percent: number;
  major_mistakes: number;
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(SubmissionOrmEntity)
    private readonly submissionRepo: Repository<SubmissionOrmEntity>,
    @InjectRepository(LessonOrmEntity)
    private readonly lessonRepo: Repository<LessonOrmEntity>,
    private readonly groupService: GroupService,
  ) {}

  async studentResults(studentId: string, limit = 20): Promise<StudentResult[]> {
    return this.collect(studentId, null, limit);
  }

  async lessonResults(studentId: string, lessonId: string): Promise<StudentResult[]> {
    return this.collect(studentId, lessonId, 20);
  }

  private async collect(
    studentId: string,
    lessonId: string | null,
    limit: number,
  ): Promise<StudentResult[]> {
    const query = this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .innerJoin("groups", "g", "g.id = l.group_id")
      .leftJoin("grades", "gr", "gr.submission_id = s.id")
      .select([
        "s.id AS submission_id",
        "l.topic AS lesson_topic",
        "g.subject AS subject",
        "a.id AS assignment_id",
        "a.question AS question",
        "a.type AS type",
        "a.max_score AS max_score",
        "s.text AS answer",
        "s.submitted_at AS submitted_at",
        "gr.score AS score",
        "gr.feedback AS feedback",
        "gr.mistakes AS mistakes",
        "gr.criteria_results AS criteria_results",
        "gr.teacher_approved AS teacher_approved",
      ])
      .where("s.student_id = :studentId", { studentId })
      .orderBy("s.submitted_at", "DESC")
      .limit(limit);

    if (lessonId) query.andWhere("a.lesson_id = :lessonId", { lessonId });

    const rows = await query.getRawMany();

    return rows.map((r) => ({
      submission_id: r.submission_id,
      lesson_topic: r.lesson_topic,
      subject: r.subject,
      assignment_id: r.assignment_id,
      question: r.question,
      type: r.type,
      answer: r.answer,
      score: r.score === null ? null : Number(r.score),
      max_score: Number(r.max_score),
      feedback: r.feedback,
      mistakes: r.mistakes ?? [],
      criteria_results: r.criteria_results ?? [],
      teacher_approved: r.teacher_approved ?? false,
      submitted_at: r.submitted_at,
    }));
  }

  async groupSummary(groupId: string, teacherId: string): Promise<GroupSummaryRow[]> {
    await this.groupService.assertOwnership(groupId, teacherId);
    return this.summary("l.group_id = :scopeId", groupId);
  }

  async lessonSummary(lessonId: string, teacherId: string): Promise<GroupSummaryRow[]> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (lesson.teacher_id !== teacherId) throw new ForbiddenException("NOT_LESSON_OWNER");
    return this.summary("a.lesson_id = :scopeId", lessonId);
  }

  private async summary(condition: string, scopeId: string): Promise<GroupSummaryRow[]> {
    const rows = await this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .innerJoin("users", "u", "u.id = s.student_id")
      .leftJoin("grades", "gr", "gr.submission_id = s.id")
      .select([
        "u.id AS student_id",
        "u.first_name AS first_name",
        "u.last_name AS last_name",
        "COUNT(s.id)::int AS submissions",
        "COALESCE(AVG(gr.score / NULLIF(a.max_score, 0)) * 100, 0) AS average_percent",
        `COALESCE(SUM((
          SELECT COUNT(*) FROM jsonb_array_elements(COALESCE(gr.mistakes, '[]'::jsonb)) m
          WHERE m->>'severity' = 'MAJOR'
        )), 0)::int AS major_mistakes`,
      ])
      .where(condition, { scopeId })
      .groupBy("u.id")
      .addGroupBy("u.first_name")
      .addGroupBy("u.last_name")
      .orderBy("average_percent", "DESC")
      .getRawMany();

    return rows.map((r) => ({
      student_id: r.student_id,
      first_name: r.first_name,
      last_name: r.last_name,
      submissions: Number(r.submissions),
      average_percent: Math.round(Number(r.average_percent)),
      major_mistakes: Number(r.major_mistakes),
    }));
  }
}

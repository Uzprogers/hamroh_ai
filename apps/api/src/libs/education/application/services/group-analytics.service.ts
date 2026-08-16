import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { SubmissionOrmEntity } from "../../infrastructure/typeorm/submission.orm-entity";
import { LessonOrmEntity } from "../../infrastructure/typeorm/lesson.orm-entity";
import { GroupMemberOrmEntity } from "../../infrastructure/typeorm/group-member.orm-entity";
import { UserOrmEntity } from "../../../identity/infrastructure/typeorm/user.orm-entity";
import { CriterionResult, MistakeItem } from "../../infrastructure/typeorm/grade.orm-entity";
import { ErrorSeverity } from "../../config/education.enums";
import { GroupService } from "./group.service";
import {
  GroupAnalytics,
  GroupGrowthLeader,
  GroupLessonSummary,
  GroupMistakeSample,
  GroupMistakeTally,
  GroupStudentAnalytics,
  StudentCriterionAverage,
  StudentDetail,
  StudentMistakeDetail,
  StudentSeverityCounts,
  StudentTimelinePoint,
} from "../types/group-analytics.types";

const LIST_LIMIT = 5;
const MISTAKE_SAMPLE_LIMIT = 10;
const STUDENT_MISTAKE_LIMIT = 30;
const AVERAGE_PERCENT = "COALESCE(AVG(gr.score / NULLIF(a.max_score, 0)) * 100, 0)";
const GRADE_PERCENT = "gr.score / NULLIF(a.max_score, 0) * 100";
const FULL_NAME = "TRIM(CONCAT(u.first_name, ' ', u.last_name))";
const MAJOR_MISTAKES = `COALESCE(SUM((
  SELECT COUNT(*) FROM jsonb_array_elements(COALESCE(gr.mistakes, '[]'::jsonb)) m
  WHERE m->>'severity' = 'MAJOR'
)), 0)::int`;

interface GradedRow {
  student_id: string;
  student_name: string;
  lesson_id: string;
  topic: string;
  percent: string;
  mistakes: MistakeItem[] | null;
  criteria_results: CriterionResult[] | null;
  submitted_at: Date;
}

interface StudentSummaryRow {
  student_id: string;
  name: string;
  submissions: string;
  average_percent: string;
  major_mistakes: string;
}

interface LessonSummaryRow {
  id: string;
  topic: string;
  created_at: Date;
  submissions: string;
}

@Injectable()
export class GroupAnalyticsService {
  constructor(
    @InjectRepository(SubmissionOrmEntity)
    private readonly submissionRepo: Repository<SubmissionOrmEntity>,
    @InjectRepository(LessonOrmEntity)
    private readonly lessonRepo: Repository<LessonOrmEntity>,
    @InjectRepository(GroupMemberOrmEntity)
    private readonly memberRepo: Repository<GroupMemberOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    private readonly groupService: GroupService,
  ) {}

  async analytics(
    groupId: string,
    teacherId: string,
    lessonId: string | null = null,
  ): Promise<GroupAnalytics> {
    const group = await this.groupService.assertOwnership(groupId, teacherId);
    if (lessonId) await this.assertLessonInGroup(lessonId, groupId);

    const [totals, summary, graded, lessons] = await Promise.all([
      this.totals(groupId, lessonId),
      this.studentSummary(groupId, lessonId),
      this.gradedRows(groupId, lessonId),
      this.lessons(groupId),
    ]);

    const growth = this.growthByStudent(graded);
    const students: GroupStudentAnalytics[] = summary.map((row) => ({
      student_id: row.student_id,
      name: row.name,
      average_percent: Math.round(Number(row.average_percent)),
      submissions: Number(row.submissions),
      growth_percent: growth.get(row.student_id) ?? null,
      major_mistakes: Number(row.major_mistakes),
    }));

    return {
      group: { id: group.id, name: group.name, subject: group.subject, code: group.code },
      average_percent: totals.average_percent,
      submissions: totals.submissions,
      students,
      growth_leaders: this.growthLeaders(students),
      top_mistakes: this.topMistakes(graded),
      lessons,
      filtered_lesson_id: lessonId,
    };
  }

  async studentDetail(
    groupId: string,
    studentId: string,
    teacherId: string,
  ): Promise<StudentDetail> {
    await this.groupService.assertOwnership(groupId, teacherId);
    await this.assertGroupMember(groupId, studentId);

    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("STUDENT_NOT_FOUND");

    const [totals, graded] = await Promise.all([
      this.totals(groupId, null, studentId),
      this.gradedRows(groupId, null, studentId),
    ]);

    return {
      student: {
        id: student.id,
        name: [student.first_name, student.last_name].filter(Boolean).join(" "),
      },
      average_percent: totals.average_percent,
      submissions: totals.submissions,
      growth_percent: this.growth(graded.map((row) => Number(row.percent))),
      timeline: this.timeline(graded),
      criteria: this.criteriaAverages(graded),
      severity_counts: this.severityCounts(graded),
      mistakes: this.studentMistakes(graded),
    };
  }

  private async assertLessonInGroup(lessonId: string, groupId: string): Promise<void> {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (lesson.group_id !== groupId) throw new NotFoundException("LESSON_NOT_IN_GROUP");
  }

  private async assertGroupMember(groupId: string, studentId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { group_id: groupId, student_id: studentId },
    });
    if (!member) throw new ForbiddenException("STUDENT_NOT_IN_GROUP");
  }

  private scoped(
    groupId: string,
    lessonId: string | null,
    studentId?: string,
  ): SelectQueryBuilder<SubmissionOrmEntity> {
    const query = this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .where("l.group_id = :groupId", { groupId });

    if (lessonId) query.andWhere("l.id = :lessonId", { lessonId });
    if (studentId) query.andWhere("s.student_id = :studentId", { studentId });
    return query;
  }

  private async totals(groupId: string, lessonId: string | null, studentId?: string) {
    const row = await this.scoped(groupId, lessonId, studentId)
      .leftJoin("grades", "gr", "gr.submission_id = s.id")
      .select(["COUNT(s.id)::int AS submissions", `${AVERAGE_PERCENT} AS average_percent`])
      .getRawOne<{ submissions: string; average_percent: string }>();

    return {
      submissions: Number(row?.submissions ?? 0),
      average_percent: Math.round(Number(row?.average_percent ?? 0)),
    };
  }

  private async studentSummary(
    groupId: string,
    lessonId: string | null,
  ): Promise<StudentSummaryRow[]> {
    return this.scoped(groupId, lessonId)
      .innerJoin("users", "u", "u.id = s.student_id")
      .leftJoin("grades", "gr", "gr.submission_id = s.id")
      .select([
        "u.id AS student_id",
        `${FULL_NAME} AS name`,
        "COUNT(s.id)::int AS submissions",
        `${AVERAGE_PERCENT} AS average_percent`,
        `${MAJOR_MISTAKES} AS major_mistakes`,
      ])
      .groupBy("u.id")
      .addGroupBy("u.first_name")
      .addGroupBy("u.last_name")
      .orderBy("average_percent", "DESC")
      .getRawMany<StudentSummaryRow>();
  }

  private async gradedRows(
    groupId: string,
    lessonId: string | null,
    studentId?: string,
  ): Promise<GradedRow[]> {
    return this.scoped(groupId, lessonId, studentId)
      .innerJoin("grades", "gr", "gr.submission_id = s.id")
      .innerJoin("users", "u", "u.id = s.student_id")
      .select([
        "s.student_id AS student_id",
        `${FULL_NAME} AS student_name`,
        "l.id AS lesson_id",
        "l.topic AS topic",
        `${GRADE_PERCENT} AS percent`,
        "gr.mistakes AS mistakes",
        "gr.criteria_results AS criteria_results",
        "s.submitted_at AS submitted_at",
      ])
      .orderBy("s.submitted_at", "ASC")
      .getRawMany<GradedRow>();
  }

  private async lessons(groupId: string): Promise<GroupLessonSummary[]> {
    const rows = await this.lessonRepo
      .createQueryBuilder("l")
      .leftJoin("assignments", "a", "a.lesson_id = l.id")
      .leftJoin("submissions", "s", "s.assignment_id = a.id")
      .select([
        "l.id AS id",
        "l.topic AS topic",
        "l.created_at AS created_at",
        "COUNT(s.id)::int AS submissions",
      ])
      .where("l.group_id = :groupId", { groupId })
      .groupBy("l.id")
      .addGroupBy("l.topic")
      .addGroupBy("l.created_at")
      .orderBy("l.created_at", "DESC")
      .getRawMany<LessonSummaryRow>();

    return rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      created_at: row.created_at,
      submissions: Number(row.submissions),
    }));
  }

  private growthByStudent(rows: GradedRow[]): Map<string, number | null> {
    const byStudent = new Map<string, number[]>();
    for (const row of rows) {
      const percents = byStudent.get(row.student_id) ?? [];
      percents.push(Number(row.percent));
      byStudent.set(row.student_id, percents);
    }

    return new Map(
      Array.from(byStudent, ([studentId, percents]) => [studentId, this.growth(percents)]),
    );
  }

  private growth(percents: number[]): number | null {
    if (percents.length < 2) return null;

    const half = Math.floor(percents.length / 2);
    const first = percents.slice(0, half);
    const last = percents.slice(percents.length - half);
    return Math.round(this.average(last) - this.average(first));
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private growthLeaders(students: GroupStudentAnalytics[]): GroupGrowthLeader[] {
    return students
      .filter((student) => (student.growth_percent ?? 0) > 0)
      .sort((left, right) => (right.growth_percent ?? 0) - (left.growth_percent ?? 0))
      .slice(0, LIST_LIMIT)
      .map((student) => ({
        student_id: student.student_id,
        name: student.name,
        growth_percent: student.growth_percent as number,
      }));
  }

  private topMistakes(rows: GradedRow[]): GroupMistakeTally[] {
    const tallies = new Map<string, GroupMistakeTally>();
    for (const row of rows) {
      for (const mistake of row.mistakes ?? []) {
        const label = mistake.correction?.trim();
        if (!label) continue;

        const tally = tallies.get(label) ?? { label, count: 0, items: [] };
        tally.count += 1;
        if (tally.items.length < MISTAKE_SAMPLE_LIMIT) tally.items.push(this.sample(row, mistake));
        tallies.set(label, tally);
      }
    }

    return Array.from(tallies.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, LIST_LIMIT);
  }

  private sample(row: GradedRow, mistake: MistakeItem): GroupMistakeSample {
    return {
      student_name: row.student_name,
      topic: row.topic,
      fragment: mistake.fragment,
      correction: mistake.correction,
      explanation: mistake.explanation,
      severity: mistake.severity,
      date: row.submitted_at,
    };
  }

  private timeline(rows: GradedRow[]): StudentTimelinePoint[] {
    const byLesson = new Map<string, { topic: string; date: Date; percents: number[] }>();
    for (const row of rows) {
      const point = byLesson.get(row.lesson_id) ?? {
        topic: row.topic,
        date: row.submitted_at,
        percents: [],
      };
      point.percents.push(Number(row.percent));
      point.date = row.submitted_at;
      byLesson.set(row.lesson_id, point);
    }

    return Array.from(byLesson, ([lessonId, point]) => ({
      lesson_id: lessonId,
      topic: point.topic,
      date: point.date,
      percent: Math.round(this.average(point.percents)),
    })).sort((left, right) => this.time(left.date) - this.time(right.date));
  }

  private criteriaAverages(rows: GradedRow[]): StudentCriterionAverage[] {
    const byName = new Map<string, number[]>();
    for (const row of rows) {
      for (const criterion of row.criteria_results ?? []) {
        const name = criterion.name?.trim();
        const max = Number(criterion.max);
        if (!name || !max) continue;

        const percents = byName.get(name) ?? [];
        percents.push((Number(criterion.score) / max) * 100);
        byName.set(name, percents);
      }
    }

    return Array.from(byName, ([name, percents]) => ({
      name,
      average_percent: Math.round(this.average(percents)),
    })).sort((left, right) => right.average_percent - left.average_percent);
  }

  private severityCounts(rows: GradedRow[]): StudentSeverityCounts {
    const counts: StudentSeverityCounts = { major: 0, minor: 0 };
    for (const row of rows) {
      for (const mistake of row.mistakes ?? []) {
        if (mistake.severity === ErrorSeverity.MAJOR) counts.major += 1;
        else counts.minor += 1;
      }
    }
    return counts;
  }

  private studentMistakes(rows: GradedRow[]): StudentMistakeDetail[] {
    return rows
      .flatMap((row) =>
        (row.mistakes ?? []).map((mistake) => ({
          fragment: mistake.fragment,
          correction: mistake.correction,
          explanation: mistake.explanation,
          severity: mistake.severity,
          topic: row.topic,
          date: row.submitted_at,
        })),
      )
      .sort((left, right) => this.time(right.date) - this.time(left.date))
      .slice(0, STUDENT_MISTAKE_LIMIT);
  }

  private time(value: Date): number {
    return new Date(value).getTime();
  }
}

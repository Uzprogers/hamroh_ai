import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { GroupMemberOrmEntity } from "../../infrastructure/typeorm/group-member.orm-entity";
import { LessonOrmEntity } from "../../infrastructure/typeorm/lesson.orm-entity";
import { SubmissionOrmEntity } from "../../infrastructure/typeorm/submission.orm-entity";
import { Role } from "../../../identity/config/identity.enums";
import { ProfileMetric } from "../../config/profile-stats.enums";
import {
  BreakdownItem,
  HighlightItem,
  MetricValue,
  ProfileStats,
  TrendPoint,
} from "../types/profile-stats.types";

const TREND_DAYS = 14;
const LIST_LIMIT = 5;

const AVERAGE_PERCENT = "COALESCE(AVG(gr.score / NULLIF(a.max_score, 0)) * 100, 0)";
const MISTAKE_COUNT = (severity?: string) => `COALESCE(SUM((
  SELECT COUNT(*) FROM jsonb_array_elements(COALESCE(gr.mistakes, '[]'::jsonb)) m
  ${severity ? `WHERE m->>'severity' = '${severity}'` : ""}
)), 0)::int`;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SubmissionOrmEntity)
    private readonly submissionRepo: Repository<SubmissionOrmEntity>,
    @InjectRepository(GroupOrmEntity)
    private readonly groupRepo: Repository<GroupOrmEntity>,
    @InjectRepository(GroupMemberOrmEntity)
    private readonly memberRepo: Repository<GroupMemberOrmEntity>,
    @InjectRepository(LessonOrmEntity)
    private readonly lessonRepo: Repository<LessonOrmEntity>,
  ) {}

  async profileStats(userId: string, role: Role): Promise<ProfileStats> {
    return role === Role.TEACHER ? this.teacherStats(userId) : this.studentStats(userId);
  }

  private scoped(userId: string, role: Role): SelectQueryBuilder<SubmissionOrmEntity> {
    const query = this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .innerJoin("groups", "g", "g.id = l.group_id")
      .leftJoin("grades", "gr", "gr.submission_id = s.id");

    return role === Role.TEACHER
      ? query.where("l.teacher_id = :userId", { userId })
      : query.where("s.student_id = :userId", { userId });
  }

  private async teacherStats(userId: string): Promise<ProfileStats> {
    const [groups, students, lessons, totals, trend, breakdown, highlights] = await Promise.all([
      this.groupRepo.count({ where: { teacher_id: userId } }),
      this.memberRepo
        .createQueryBuilder("m")
        .innerJoin("groups", "g", "g.id = m.group_id")
        .where("g.teacher_id = :userId", { userId })
        .select("COUNT(DISTINCT m.student_id)::int", "value")
        .getRawOne<{ value: number }>(),
      this.lessonRepo.count({ where: { teacher_id: userId } }),
      this.totals(userId, Role.TEACHER),
      this.trend(userId, Role.TEACHER),
      this.teacherBreakdown(userId),
      this.teacherHighlights(userId),
    ]);

    const metrics: MetricValue[] = [
      { key: ProfileMetric.GROUPS, value: groups },
      { key: ProfileMetric.STUDENTS, value: Number(students?.value ?? 0) },
      { key: ProfileMetric.LESSONS, value: lessons },
      { key: ProfileMetric.GRADED, value: totals.graded },
      { key: ProfileMetric.MAJOR_MISTAKES, value: totals.major },
    ];

    return {
      role: Role.TEACHER,
      average_percent: totals.average_percent,
      metrics,
      trend,
      breakdown,
      highlights,
    };
  }

  private async studentStats(userId: string): Promise<ProfileStats> {
    const [groups, totals, trend, breakdown, highlights] = await Promise.all([
      this.memberRepo.count({ where: { student_id: userId } }),
      this.totals(userId, Role.STUDENT),
      this.trend(userId, Role.STUDENT),
      this.studentBreakdown(userId),
      this.studentHighlights(userId),
    ]);

    const metrics: MetricValue[] = [
      { key: ProfileMetric.SUBMISSIONS, value: totals.submissions },
      { key: ProfileMetric.GRADED, value: totals.graded },
      { key: ProfileMetric.MISTAKES, value: totals.mistakes },
      { key: ProfileMetric.SUBJECTS, value: breakdown.length },
      { key: ProfileMetric.GROUPS, value: groups },
    ];

    return {
      role: Role.STUDENT,
      average_percent: totals.average_percent,
      metrics,
      trend,
      breakdown,
      highlights,
    };
  }

  private async totals(userId: string, role: Role) {
    const row = await this.scoped(userId, role)
      .select([
        "COUNT(s.id)::int AS submissions",
        "COUNT(gr.id)::int AS graded",
        `${AVERAGE_PERCENT} AS average_percent`,
        `${MISTAKE_COUNT()} AS mistakes`,
        `${MISTAKE_COUNT("MAJOR")} AS major`,
      ])
      .getRawOne<{
        submissions: string;
        graded: string;
        average_percent: string;
        mistakes: string;
        major: string;
      }>();

    return {
      submissions: Number(row?.submissions ?? 0),
      graded: Number(row?.graded ?? 0),
      average_percent: Math.round(Number(row?.average_percent ?? 0)),
      mistakes: Number(row?.mistakes ?? 0),
      major: Number(row?.major ?? 0),
    };
  }

  private async trend(userId: string, role: Role): Promise<TrendPoint[]> {
    const rows = await this.scoped(userId, role)
      .andWhere(`s.submitted_at >= NOW() - INTERVAL '${TREND_DAYS - 1} days'`)
      .select(["to_char(s.submitted_at, 'YYYY-MM-DD') AS date", "COUNT(s.id)::int AS count"])
      .groupBy("date")
      .getRawMany<{ date: string; count: string }>();

    const counts = new Map(rows.map((row) => [row.date, Number(row.count)]));
    const today = new Date();

    return Array.from({ length: TREND_DAYS }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (TREND_DAYS - 1 - index));
      const date = day.toISOString().slice(0, 10);
      return { date, count: counts.get(date) ?? 0 };
    });
  }

  private async teacherBreakdown(userId: string): Promise<BreakdownItem[]> {
    const rows = await this.scoped(userId, Role.TEACHER)
      .select([
        "g.name AS label",
        `${AVERAGE_PERCENT} AS average_percent`,
        "COUNT(s.id)::int AS submissions",
      ])
      .groupBy("g.name")
      .orderBy("submissions", "DESC")
      .limit(LIST_LIMIT)
      .getRawMany<{ label: string; average_percent: string; submissions: string }>();

    return this.mapBreakdown(rows);
  }

  private async studentBreakdown(userId: string): Promise<BreakdownItem[]> {
    const rows = await this.scoped(userId, Role.STUDENT)
      .select([
        "g.subject AS label",
        `${AVERAGE_PERCENT} AS average_percent`,
        "COUNT(s.id)::int AS submissions",
      ])
      .groupBy("g.subject")
      .orderBy("submissions", "DESC")
      .limit(LIST_LIMIT)
      .getRawMany<{ label: string; average_percent: string; submissions: string }>();

    return this.mapBreakdown(rows);
  }

  private mapBreakdown(
    rows: { label: string; average_percent: string; submissions: string }[],
  ): BreakdownItem[] {
    return rows.map((row) => ({
      label: row.label,
      average_percent: Math.round(Number(row.average_percent)),
      submissions: Number(row.submissions),
    }));
  }

  private async teacherHighlights(userId: string): Promise<HighlightItem[]> {
    const rows = await this.scoped(userId, Role.TEACHER)
      .innerJoin("users", "u", "u.id = s.student_id")
      .select([
        "u.first_name AS first_name",
        "u.last_name AS last_name",
        "g.name AS caption",
        `${AVERAGE_PERCENT} AS percent`,
      ])
      .groupBy("u.id")
      .addGroupBy("u.first_name")
      .addGroupBy("u.last_name")
      .addGroupBy("g.name")
      .orderBy("percent", "DESC")
      .limit(LIST_LIMIT)
      .getRawMany<{ first_name: string; last_name: string | null; caption: string; percent: string }>();

    return rows.map((row) => ({
      label: [row.first_name, row.last_name].filter(Boolean).join(" "),
      caption: row.caption,
      percent: Math.round(Number(row.percent)),
    }));
  }

  private async studentHighlights(userId: string): Promise<HighlightItem[]> {
    const rows = await this.scoped(userId, Role.STUDENT)
      .andWhere("gr.id IS NOT NULL")
      .select([
        "l.topic AS label",
        "g.subject AS caption",
        "gr.score / NULLIF(a.max_score, 0) * 100 AS percent",
        "s.submitted_at AS submitted_at",
      ])
      .orderBy("s.submitted_at", "DESC")
      .limit(LIST_LIMIT)
      .getRawMany<{ label: string; caption: string; percent: string }>();

    return rows.map((row) => ({
      label: row.label,
      caption: row.caption,
      percent: Math.round(Number(row.percent)),
    }));
  }
}

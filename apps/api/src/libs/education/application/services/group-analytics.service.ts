import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubmissionOrmEntity } from "../../infrastructure/typeorm/submission.orm-entity";
import { MistakeItem } from "../../infrastructure/typeorm/grade.orm-entity";
import { GroupService } from "./group.service";
import { ResultsService } from "./results.service";
import {
  GroupAnalytics,
  GroupGrowthLeader,
  GroupMistakeTally,
  GroupStudentAnalytics,
} from "../types/group-analytics.types";

const LIST_LIMIT = 5;
const AVERAGE_PERCENT = "COALESCE(AVG(gr.score / NULLIF(a.max_score, 0)) * 100, 0)";
const GRADE_PERCENT = "gr.score / NULLIF(a.max_score, 0) * 100";

interface GradedRow {
  student_id: string;
  percent: string;
  mistakes: MistakeItem[] | null;
}

@Injectable()
export class GroupAnalyticsService {
  constructor(
    @InjectRepository(SubmissionOrmEntity)
    private readonly submissionRepo: Repository<SubmissionOrmEntity>,
    private readonly groupService: GroupService,
    private readonly resultsService: ResultsService,
  ) {}

  async analytics(groupId: string, teacherId: string): Promise<GroupAnalytics> {
    const group = await this.groupService.assertOwnership(groupId, teacherId);
    const [summary, totals, graded] = await Promise.all([
      this.resultsService.groupSummary(groupId, teacherId),
      this.totals(groupId),
      this.gradedRows(groupId),
    ]);

    const growth = this.growthByStudent(graded);
    const students: GroupStudentAnalytics[] = summary.map((row) => ({
      student_id: row.student_id,
      name: [row.first_name, row.last_name].filter(Boolean).join(" "),
      average_percent: row.average_percent,
      submissions: row.submissions,
      growth_percent: growth.get(row.student_id) ?? null,
      major_mistakes: row.major_mistakes,
    }));

    return {
      group: { id: group.id, name: group.name, subject: group.subject },
      average_percent: totals.average_percent,
      submissions: totals.submissions,
      students,
      growth_leaders: this.growthLeaders(students),
      top_mistakes: this.topMistakes(graded),
    };
  }

  private scoped(groupId: string) {
    return this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .where("l.group_id = :groupId", { groupId });
  }

  private async totals(groupId: string) {
    const row = await this.scoped(groupId)
      .leftJoin("grades", "gr", "gr.submission_id = s.id")
      .select(["COUNT(s.id)::int AS submissions", `${AVERAGE_PERCENT} AS average_percent`])
      .getRawOne<{ submissions: string; average_percent: string }>();

    return {
      submissions: Number(row?.submissions ?? 0),
      average_percent: Math.round(Number(row?.average_percent ?? 0)),
    };
  }

  private async gradedRows(groupId: string): Promise<GradedRow[]> {
    return this.scoped(groupId)
      .innerJoin("grades", "gr", "gr.submission_id = s.id")
      .select([
        "s.student_id AS student_id",
        `${GRADE_PERCENT} AS percent`,
        "gr.mistakes AS mistakes",
      ])
      .orderBy("s.submitted_at", "ASC")
      .getRawMany<GradedRow>();
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
    const counts = new Map<string, number>();
    for (const row of rows) {
      for (const mistake of row.mistakes ?? []) {
        const label = mistake.correction?.trim();
        if (!label) continue;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }

    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, LIST_LIMIT);
  }
}

import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubmissionOrmEntity } from "../../infrastructure/typeorm/submission.orm-entity";
import { AssignmentOrmEntity } from "../../infrastructure/typeorm/assignment.orm-entity";
import {
  CriterionResult,
  GradeOrmEntity,
  MistakeItem,
} from "../../infrastructure/typeorm/grade.orm-entity";
import { LlmService } from "../../../agent/infrastructure/llm.service";
import { SubmitAnswerDto } from "../dto/submit-answer.dto";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";

interface GeneratedGrade {
  score: number;
  feedback: string;
  mistakes: MistakeItem[];
  criteria_results: CriterionResult[];
}

const SYSTEM_PROMPT = `You are an impartial grader in the Uzbek education system.
Grade the student's answer strictly against the assignment criteria.
Return JSON only.

Schema:
{
  "score": 7.5,
  "feedback": "2-3 sentences addressed to the student: what worked, what to fix",
  "mistakes": [{"fragment": "text from the answer", "correction": "corrected form", "explanation": "short reason", "severity": "MINOR" | "MAJOR"}],
  "criteria_results": [{"name": "criterion name", "score": 3, "max": 4, "comment": "short justification"}]
}

Rules:
- score ranges from 0 to max_score and equals the sum of criteria scores
- list a mistake only when it truly appears in the answer; never invent one
- feedback speaks directly to the student, no flattery
- an empty or off-topic answer scores 0
- when the subject is a foreign language, the answer belongs in that language: judge it there and
  never treat writing in the target language as a mistake`;

@Injectable()
export class GradingService {
  constructor(
    @InjectRepository(SubmissionOrmEntity)
    private readonly submissionRepo: Repository<SubmissionOrmEntity>,
    @InjectRepository(GradeOrmEntity) private readonly gradeRepo: Repository<GradeOrmEntity>,
    @InjectRepository(AssignmentOrmEntity)
    private readonly assignmentRepo: Repository<AssignmentOrmEntity>,
    private readonly ai: LlmService,
  ) {}

  async submitAndGrade(studentId: string, locale: Locale, dto: SubmitAnswerDto) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException("ASSIGNMENT_NOT_FOUND");

    const existing = await this.submissionRepo.findOne({
      where: { assignment_id: assignment.id, student_id: studentId },
    });

    const submission = await this.submissionRepo.save(
      existing
        ? Object.assign(existing, { text: dto.text, submitted_at: new Date() })
        : this.submissionRepo.create({
            assignment_id: assignment.id,
            student_id: studentId,
            text: dto.text,
          }),
    );

    const grade = await this.grade(submission, assignment, locale);
    return { submission, grade };
  }

  async grade(
    submission: SubmissionOrmEntity,
    assignment: AssignmentOrmEntity,
    locale: Locale,
  ): Promise<GradeOrmEntity> {
    const subject = await this.subjectOf(assignment.id);

    const generated = await this.ai.json<GeneratedGrade>(
      `${SYSTEM_PROMPT}\n\n${LANGUAGE_INSTRUCTION[locale]}`,
      [
        `Subject: ${subject ?? "unknown"}`,
        `Assignment type: ${assignment.type}`,
        `Assignment: ${assignment.question}`,
        `Max score: ${assignment.max_score}`,
        `Criteria: ${JSON.stringify(assignment.criteria)}`,
        assignment.expected_answer ? `Model answer: ${assignment.expected_answer}` : "",
        `Student answer: ${submission.text ?? "(empty)"}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const score = Math.max(0, Math.min(assignment.max_score, Number(generated.score) || 0));
    const existing = await this.gradeRepo.findOne({ where: { submission_id: submission.id } });

    return this.gradeRepo.save(
      existing
        ? Object.assign(existing, {
            score: score.toFixed(2),
            feedback: generated.feedback,
            mistakes: generated.mistakes ?? [],
            criteria_results: generated.criteria_results ?? [],
            ai_model: this.ai.model,
            teacher_approved: false,
          })
        : this.gradeRepo.create({
            submission_id: submission.id,
            score: score.toFixed(2),
            max_score: assignment.max_score,
            feedback: generated.feedback,
            mistakes: generated.mistakes ?? [],
            criteria_results: generated.criteria_results ?? [],
            ai_model: this.ai.model,
          }),
    );
  }

  private async subjectOf(assignmentId: string): Promise<string | null> {
    const row = await this.assignmentRepo
      .createQueryBuilder("a")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .innerJoin("groups", "g", "g.id = l.group_id")
      .select("g.subject", "subject")
      .where("a.id = :assignmentId", { assignmentId })
      .getRawOne<{ subject: string }>();

    return row?.subject ?? null;
  }

  async approve(gradeId: string, teacherId: string) {
    const grade = await this.gradeRepo.findOne({ where: { id: gradeId } });
    if (!grade) throw new NotFoundException("GRADE_NOT_FOUND");

    const owned = await this.submissionRepo
      .createQueryBuilder("s")
      .innerJoin("assignments", "a", "a.id = s.assignment_id")
      .innerJoin("lessons", "l", "l.id = a.lesson_id")
      .where("s.id = :submissionId", { submissionId: grade.submission_id })
      .andWhere("l.teacher_id = :teacherId", { teacherId })
      .getOne();

    if (!owned) throw new ForbiddenException("NOT_LESSON_OWNER");

    grade.teacher_approved = true;
    return this.gradeRepo.save(grade);
  }
}

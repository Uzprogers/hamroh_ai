import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LessonOrmEntity, PlanStep } from "../../infrastructure/typeorm/lesson.orm-entity";
import { AssignmentOrmEntity, Criterion } from "../../infrastructure/typeorm/assignment.orm-entity";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { LlmService } from "../../../agent/infrastructure/llm.service";
import { AssignmentType, LessonStatus } from "../../config/education.enums";
import { CreateLessonDto } from "../dto/create-lesson.dto";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";
import { InstitutionType } from "../../../identity/config/identity.enums";

interface GeneratedLesson {
  objective: string;
  plan: PlanStep[];
  assignments: {
    type: AssignmentType;
    question: string;
    expected_answer: string;
    criteria: Criterion[];
    max_score: number;
  }[];
}

const SYSTEM_PROMPT = `You are a curriculum assistant for the Uzbek education system.
Given a teacher's topic, you produce one lesson plan and its assignments.
Return JSON only, no prose.

Schema:
{
  "objective": "one sentence learning objective",
  "plan": [{"title": "...", "description": "...", "minutes": 10}],
  "assignments": [
    {
      "type": "WRITTEN" | "QUIZ" | "SPEAKING",
      "question": "exact task text shown to the student",
      "expected_answer": "model answer",
      "criteria": [{"name": "...", "weight": 40, "description": "what earns the points"}],
      "max_score": 10
    }
  ]
}

Rules:
- plan holds 4 to 6 steps totalling 45 minutes
- exactly 3 assignments; include one SPEAKING task for language subjects
- 2 to 4 criteria per assignment, weights summing to 100
- tasks must be concrete and answerable, never vague
- when the subject is a foreign language, the student answers IN THAT LANGUAGE: say so inside the
  question text, and write expected_answer in the target language`;

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(LessonOrmEntity) private readonly lessonRepo: Repository<LessonOrmEntity>,
    @InjectRepository(AssignmentOrmEntity)
    private readonly assignmentRepo: Repository<AssignmentOrmEntity>,
    @InjectRepository(GroupOrmEntity) private readonly groupRepo: Repository<GroupOrmEntity>,
    private readonly ai: LlmService,
  ) {}

  async create(teacherId: string, locale: Locale, dto: CreateLessonDto) {
    const group = await this.groupRepo.findOne({ where: { id: dto.group_id } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");
    if (group.teacher_id !== teacherId) throw new ForbiddenException("NOT_GROUP_OWNER");

    const generated = await this.ai.json<GeneratedLesson>(
      `${SYSTEM_PROMPT}\n\n${LANGUAGE_INSTRUCTION[locale]}`,
      [
        `Subject: ${group.subject}`,
        `Group: ${group.name}`,
        `Institution: ${group.institution_type === InstitutionType.SCHOOL ? "secondary school" : "university"}`,
        `Topic: ${dto.topic}`,
        dto.note ? `Teacher note: ${dto.note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const lesson = await this.lessonRepo.save(
      this.lessonRepo.create({
        group_id: group.id,
        teacher_id: teacherId,
        topic: dto.topic,
        objective: generated.objective,
        plan: generated.plan ?? [],
        status: LessonStatus.DRAFT,
      }),
    );

    const assignments = await this.assignmentRepo.save(
      (generated.assignments ?? []).map((a, index) =>
        this.assignmentRepo.create({
          lesson_id: lesson.id,
          type: a.type,
          question: a.question,
          expected_answer: a.expected_answer,
          criteria: a.criteria ?? [],
          max_score: a.max_score ?? 10,
          order_index: index,
        }),
      ),
    );

    return { lesson, assignments };
  }

  async listForTeacher(teacherId: string) {
    return this.lessonRepo.find({ where: { teacher_id: teacherId }, order: { created_at: "DESC" } });
  }

  async listForStudent(studentId: string) {
    return this.lessonRepo
      .createQueryBuilder("l")
      .innerJoin("group_members", "m", "m.group_id = l.group_id")
      .where("m.student_id = :studentId", { studentId })
      .andWhere("l.status = :status", { status: LessonStatus.ACTIVE })
      .orderBy("l.created_at", "DESC")
      .getMany();
  }

  async detail(lessonId: string, userId: string, isTeacher: boolean) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (isTeacher && lesson.teacher_id !== userId) throw new ForbiddenException("NOT_LESSON_OWNER");

    const assignments = await this.assignmentRepo.find({
      where: { lesson_id: lesson.id },
      order: { order_index: "ASC" },
    });

    return { lesson, assignments };
  }

  async changeStatus(lessonId: string, teacherId: string, status: LessonStatus) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (lesson.teacher_id !== teacherId) throw new ForbiddenException("NOT_LESSON_OWNER");

    lesson.status = status;
    return this.lessonRepo.save(lesson);
  }
}

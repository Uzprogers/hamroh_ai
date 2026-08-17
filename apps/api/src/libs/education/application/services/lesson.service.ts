import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { LessonOrmEntity, PlanStep } from "../../infrastructure/typeorm/lesson.orm-entity";
import { AssignmentOrmEntity, Criterion } from "../../infrastructure/typeorm/assignment.orm-entity";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { LlmService } from "../../../agent/infrastructure/llm.service";
import { GroupService } from "./group.service";
import { AssignmentType, LessonStatus } from "../../config/education.enums";
import { CreateLessonDto } from "../dto/create-lesson.dto";
import { Locale } from "../../../../core/i18n/locale.enum";
import { LANGUAGE_INSTRUCTION } from "../../../../core/i18n/prompt-language";
import { INSTITUTION_PROMPT_LABEL } from "../../config/institution.labels";

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
    private readonly groupService: GroupService,
    private readonly ai: LlmService,
  ) {}

  async create(teacherId: string, locale: Locale, dto: CreateLessonDto) {
    const groups = await this.ownedGroups(teacherId, dto.group_ids);
    const [first] = groups;

    const generated = await this.ai.json<GeneratedLesson>(
      `${SYSTEM_PROMPT}\n\n${LANGUAGE_INSTRUCTION[locale]}`,
      [
        `Subject: ${first.subject}`,
        `Group: ${groups.map((group) => group.name).join(", ")}`,
        `Institution: ${INSTITUTION_PROMPT_LABEL[first.institution_type]}`,
        `Topic: ${dto.topic}`,
        dto.note ? `Teacher note: ${dto.note}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const lessons = await this.lessonRepo.save(
      groups.map((group) =>
        this.lessonRepo.create({
          group_id: group.id,
          teacher_id: teacherId,
          topic: dto.topic,
          objective: generated.objective,
          plan: generated.plan ?? [],
          status: LessonStatus.DRAFT,
        }),
      ),
    );

    const assignments = await this.assignmentRepo.save(
      lessons.flatMap((lesson) =>
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
      ),
    );

    return {
      lessons,
      lesson: lessons[0],
      assignments: assignments.filter((a) => a.lesson_id === lessons[0].id),
    };
  }

  private async ownedGroups(teacherId: string, ids: string[]): Promise<GroupOrmEntity[]> {
    const unique = [...new Set(ids)];
    const groups = await this.groupRepo.find({ where: { id: In(unique) } });
    if (groups.length !== unique.length) throw new NotFoundException("GROUP_NOT_FOUND");
    if (groups.some((group) => group.teacher_id !== teacherId)) {
      throw new ForbiddenException("NOT_GROUP_OWNER");
    }

    const [first] = groups;
    const mixed = groups.some(
      (group) => group.subject !== first.subject || group.grade_level !== first.grade_level,
    );
    if (mixed) throw new BadRequestException("GROUPS_NOT_COMPATIBLE");

    return groups;
  }

  async listForTeacher(teacherId: string) {
    return this.lessonRepo.find({ where: { teacher_id: teacherId }, order: { created_at: "DESC" } });
  }

  async listForStudent(studentId: string) {
    return this.lessonRepo
      .createQueryBuilder("l")
      .innerJoin("group_members", "m", "m.group_id = l.group_id")
      .where("m.student_id = :studentId", { studentId })
      .andWhere("l.status IN (:...statuses)", {
        statuses: [LessonStatus.ACTIVE, LessonStatus.CLOSED],
      })
      .orderBy("l.created_at", "DESC")
      .getMany();
  }

  async detail(lessonId: string, userId: string, isTeacher: boolean) {
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException("LESSON_NOT_FOUND");
    if (isTeacher && lesson.teacher_id !== userId) throw new ForbiddenException("NOT_LESSON_OWNER");
    if (!isTeacher) await this.groupService.assertMembership(userId, lesson.group_id);

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

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionOrmEntity } from "../../infrastructure/typeorm/session.orm-entity";
import { SessionMessageOrmEntity } from "../../infrastructure/typeorm/session-message.orm-entity";
import { MessageSender } from "../../config/session.enums";
import { GroupService } from "../../../education/application/services/group.service";
import { AuthService } from "../../../identity/application/services/auth.service";
import { StudentContext } from "../session-prompt";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionOrmEntity) private readonly sessionRepo: Repository<SessionOrmEntity>,
    @InjectRepository(SessionMessageOrmEntity)
    private readonly messageRepo: Repository<SessionMessageOrmEntity>,
    private readonly groupService: GroupService,
    private readonly authService: AuthService,
  ) {}

  async open(studentId: string, lessonId: string | null) {
    return this.sessionRepo.save(
      this.sessionRepo.create({ student_id: studentId, lesson_id: lessonId }),
    );
  }

  async close(sessionId: string): Promise<void> {
    await this.sessionRepo.update({ id: sessionId }, { ended_at: new Date() });
  }

  async record(
    sessionId: string,
    sender: MessageSender,
    text: string | null,
    toolName?: string,
    toolResult?: unknown,
  ): Promise<void> {
    await this.messageRepo.save(
      this.messageRepo.create({
        session_id: sessionId,
        sender,
        text,
        tool_name: toolName ?? null,
        tool_result: toolResult ?? null,
      }),
    );
  }

  async studentContext(studentId: string): Promise<StudentContext & { id: string }> {
    const profile = await this.authService.me(studentId);
    const groups = await this.groupService.listForStudent(studentId);

    return {
      id: profile.id,
      first_name: profile.first_name,
      institution_name: profile.institution_name ?? "",
      grade_level: profile.grade_level,
      subjects: [...new Set(groups.map((g) => g.subject))],
      locale: profile.locale,
    };
  }

  async transcript(sessionId: string) {
    return this.messageRepo.find({
      where: { session_id: sessionId },
      order: { created_at: "ASC" },
    });
  }
}

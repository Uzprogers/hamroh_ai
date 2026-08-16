import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { GroupMemberOrmEntity } from "../../infrastructure/typeorm/group-member.orm-entity";
import { UserOrmEntity } from "../../../identity/infrastructure/typeorm/user.orm-entity";
import { CreateGroupDto } from "../dto/create-group.dto";
import { Role } from "../../../identity/config/identity.enums";
import {
  GROUP_CODE_ALPHABET,
  GROUP_CODE_ATTEMPTS,
  GROUP_CODE_LENGTH,
  MemberSource,
} from "../../config/education.enums";
import { GroupMemberRow, StudentGroupRow } from "../types/group-join.types";

interface StudentGroupRaw {
  id: string;
  name: string;
  subject: string;
  grade_level: number | null;
  first_name: string;
  last_name: string | null;
  member_count: string;
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupOrmEntity) private readonly groupRepo: Repository<GroupOrmEntity>,
    @InjectRepository(GroupMemberOrmEntity)
    private readonly memberRepo: Repository<GroupMemberOrmEntity>,
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  async create(teacherId: string, dto: CreateGroupDto) {
    return this.groupRepo.save(
      this.groupRepo.create({
        ...dto,
        grade_level: dto.grade_level ?? null,
        teacher_id: teacherId,
        code: await this.uniqueCode(),
      }),
    );
  }

  async listForTeacher(teacherId: string) {
    const groups = await this.groupRepo.find({
      where: { teacher_id: teacherId },
      order: { created_at: "DESC" },
    });
    if (!groups.length) return [];

    const counts = await this.memberRepo
      .createQueryBuilder("m")
      .select("m.group_id", "group_id")
      .addSelect("COUNT(*)::int", "total")
      .where("m.group_id IN (:...ids)", { ids: groups.map((g) => g.id) })
      .groupBy("m.group_id")
      .getRawMany<{ group_id: string; total: number }>();

    const byGroup = new Map(counts.map((c) => [c.group_id, c.total]));
    return groups.map((g) => ({ ...g, member_count: byGroup.get(g.id) ?? 0 }));
  }

  async listForStudent(studentId: string): Promise<StudentGroupRow[]> {
    const rows = await this.groupRepo
      .createQueryBuilder("g")
      .innerJoin("group_members", "m", "m.group_id = g.id")
      .innerJoin(UserOrmEntity, "t", "t.id = g.teacher_id")
      .select("g.id", "id")
      .addSelect("g.name", "name")
      .addSelect("g.subject", "subject")
      .addSelect("g.grade_level", "grade_level")
      .addSelect("t.first_name", "first_name")
      .addSelect("t.last_name", "last_name")
      .addSelect("(SELECT COUNT(*) FROM group_members c WHERE c.group_id = g.id)", "member_count")
      .where("m.student_id = :studentId", { studentId })
      .orderBy("m.joined_at", "DESC")
      .getRawMany<StudentGroupRaw>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      grade_level: row.grade_level,
      teacher_name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
      member_count: Number(row.member_count),
    }));
  }

  async members(groupId: string, teacherId: string): Promise<GroupMemberRow[]> {
    await this.assertOwnership(groupId, teacherId);

    const rows = await this.userRepo
      .createQueryBuilder("u")
      .innerJoin("group_members", "m", "m.student_id = u.id")
      .select("u.id", "id")
      .addSelect("u.first_name", "first_name")
      .addSelect("u.last_name", "last_name")
      .addSelect("u.phone", "phone")
      .addSelect("u.grade_level", "grade_level")
      .addSelect("m.source", "source")
      .addSelect("m.joined_at", "joined_at")
      .where("m.group_id = :groupId", { groupId })
      .orderBy("m.joined_at", "DESC")
      .getRawMany<GroupMemberRow>();

    return rows;
  }

  async addMember(groupId: string, teacherId: string, phone: string) {
    await this.assertOwnership(groupId, teacherId);

    const student = await this.userRepo.findOne({ where: { phone, role: Role.STUDENT } });
    if (!student) throw new NotFoundException("STUDENT_NOT_FOUND");

    await this.link(groupId, student.id, MemberSource.TEACHER);
    return student;
  }

  async removeMember(groupId: string, teacherId: string, studentId: string): Promise<void> {
    await this.assertOwnership(groupId, teacherId);
    await this.memberRepo.delete({ group_id: groupId, student_id: studentId });
  }

  async joinGroup(
    studentId: string,
    groupId: string,
    source: MemberSource,
  ): Promise<GroupOrmEntity> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");

    const student = await this.requireStudent(studentId);
    this.assertGrade(group, student);
    await this.link(group.id, studentId, source);
    await this.transferSchool(studentId, group);
    return group;
  }

  async joinByCode(studentId: string, code: string): Promise<GroupOrmEntity> {
    const clean = code.trim().toUpperCase();
    const group = await this.groupRepo.findOne({ where: { code: clean } });
    if (!group) throw new NotFoundException("GROUP_CODE_NOT_FOUND");

    return this.joinGroup(studentId, group.id, MemberSource.CODE);
  }

  async schoolOf(teacherId: string): Promise<string> {
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    return teacher?.institution_name ?? "";
  }

  async assertOwnership(groupId: string, teacherId: string): Promise<GroupOrmEntity> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");
    if (group.teacher_id !== teacherId) throw new ForbiddenException("NOT_GROUP_OWNER");
    return group;
  }

  async assertStudentAccess(studentId: string, teacherId: string): Promise<void> {
    const linked = await this.memberRepo
      .createQueryBuilder("m")
      .innerJoin("groups", "g", "g.id = m.group_id")
      .where("m.student_id = :studentId", { studentId })
      .andWhere("g.teacher_id = :teacherId", { teacherId })
      .getCount();
    if (!linked) throw new ForbiddenException("STUDENT_NOT_IN_GROUP");
  }

  private async link(groupId: string, studentId: string, source: MemberSource): Promise<void> {
    await this.memberRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(GroupMemberOrmEntity)
        .where("student_id = :studentId", { studentId })
        .andWhere("group_id != :groupId", { groupId })
        .execute();

      await manager
        .createQueryBuilder()
        .insert()
        .into(GroupMemberOrmEntity)
        .values({ group_id: groupId, student_id: studentId, source })
        .orIgnore()
        .execute();
    });
  }

  private async transferSchool(studentId: string, group: GroupOrmEntity): Promise<void> {
    const teacher = await this.userRepo.findOne({ where: { id: group.teacher_id } });
    const school = teacher?.institution_name?.trim();
    if (!school) return;

    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student || this.sameSchool(student.institution_name, school)) return;

    await this.userRepo.update(
      { id: studentId },
      {
        institution_name: school,
        institution_type: teacher?.institution_type ?? group.institution_type,
      },
    );
  }

  private assertGrade(group: GroupOrmEntity, student: UserOrmEntity): void {
    if (group.grade_level === null) return;
    if (this.gradeOf(student.grade_level) !== group.grade_level) {
      throw new ForbiddenException("GRADE_MISMATCH");
    }
  }

  private gradeOf(value: string | null): number | null {
    const digits = (value ?? "").trim().match(/^\d+/);
    return digits ? Number(digits[0]) : null;
  }

  private async requireStudent(studentId: string): Promise<UserOrmEntity> {
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException("STUDENT_NOT_FOUND");
    if (student.role !== Role.STUDENT) throw new ForbiddenException("NOT_STUDENT");
    return student;
  }

  private sameSchool(left: string | null, right: string | null): boolean {
    const first = this.normalize(left);
    return Boolean(first) && first === this.normalize(right);
  }

  private normalize(value: string | null): string {
    return (value ?? "").trim().toLowerCase();
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < GROUP_CODE_ATTEMPTS; attempt += 1) {
      const code = Array.from(
        { length: GROUP_CODE_LENGTH },
        () => GROUP_CODE_ALPHABET[Math.floor(Math.random() * GROUP_CODE_ALPHABET.length)],
      ).join("");
      const taken = await this.groupRepo.exists({ where: { code } });
      if (!taken) return code;
    }
    throw new BadRequestException("GROUP_CODE_UNAVAILABLE");
  }
}

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
import { GroupMemberRow, SchoolGroupRow } from "../types/group-join.types";

interface SchoolGroupRaw {
  id: string;
  name: string;
  subject: string;
  first_name: string;
  last_name: string | null;
  member_count: string;
  is_member: boolean;
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
      this.groupRepo.create({ ...dto, teacher_id: teacherId, code: await this.uniqueCode() }),
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

  async listForStudent(studentId: string) {
    return this.groupRepo
      .createQueryBuilder("g")
      .innerJoin("group_members", "m", "m.group_id = g.id")
      .where("m.student_id = :studentId", { studentId })
      .getMany();
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

    await this.requireStudent(studentId);
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

  async joinSchoolGroup(studentId: string, groupId: string): Promise<GroupOrmEntity> {
    const student = await this.requireStudent(studentId);
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");

    const teacher = await this.userRepo.findOne({ where: { id: group.teacher_id } });
    if (!this.sameSchool(teacher?.institution_name ?? null, student.institution_name)) {
      throw new ForbiddenException("GROUP_NOT_IN_SCHOOL");
    }

    return this.joinGroup(studentId, group.id, MemberSource.SCHOOL);
  }

  async schoolOf(teacherId: string): Promise<string> {
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    return teacher?.institution_name ?? "";
  }

  async schoolGroups(studentId: string): Promise<SchoolGroupRow[]> {
    const student = await this.requireStudent(studentId);
    const school = this.normalize(student.institution_name);
    if (!school) return [];

    const rows = await this.groupRepo
      .createQueryBuilder("g")
      .innerJoin(UserOrmEntity, "t", "t.id = g.teacher_id")
      .select("g.id", "id")
      .addSelect("g.name", "name")
      .addSelect("g.subject", "subject")
      .addSelect("t.first_name", "first_name")
      .addSelect("t.last_name", "last_name")
      .addSelect(
        "(SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id)",
        "member_count",
      )
      .addSelect(
        `EXISTS (SELECT 1 FROM group_members m WHERE m.group_id = g.id AND m.student_id = :studentId)`,
        "is_member",
      )
      .where("lower(btrim(t.institution_name)) = :school", { school })
      .setParameter("studentId", studentId)
      .orderBy("g.created_at", "DESC")
      .getRawMany<SchoolGroupRaw>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      teacher_name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
      member_count: Number(row.member_count),
      is_member: row.is_member,
    }));
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
    await this.memberRepo
      .createQueryBuilder()
      .insert()
      .into(GroupMemberOrmEntity)
      .values({ group_id: groupId, student_id: studentId, source })
      .orIgnore()
      .execute();
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

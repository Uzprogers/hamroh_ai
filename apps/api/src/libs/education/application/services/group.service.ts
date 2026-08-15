import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupOrmEntity } from "../../infrastructure/typeorm/group.orm-entity";
import { GroupMemberOrmEntity } from "../../infrastructure/typeorm/group-member.orm-entity";
import { UserOrmEntity } from "../../../identity/infrastructure/typeorm/user.orm-entity";
import { CreateGroupDto } from "../dto/create-group.dto";
import { Role } from "../../../identity/config/identity.enums";

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupOrmEntity) private readonly groupRepo: Repository<GroupOrmEntity>,
    @InjectRepository(GroupMemberOrmEntity)
    private readonly memberRepo: Repository<GroupMemberOrmEntity>,
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  async create(teacherId: string, dto: CreateGroupDto) {
    return this.groupRepo.save(this.groupRepo.create({ ...dto, teacher_id: teacherId }));
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

  async members(groupId: string, teacherId: string) {
    await this.assertOwnership(groupId, teacherId);

    return this.userRepo
      .createQueryBuilder("u")
      .innerJoin("group_members", "m", "m.student_id = u.id")
      .where("m.group_id = :groupId", { groupId })
      .orderBy("u.last_name", "ASC")
      .getMany();
  }

  async addMember(groupId: string, teacherId: string, phone: string) {
    await this.assertOwnership(groupId, teacherId);

    const student = await this.userRepo.findOne({ where: { phone, role: Role.STUDENT } });
    if (!student) throw new NotFoundException("STUDENT_NOT_FOUND");

    await this.memberRepo.save(
      this.memberRepo.create({ group_id: groupId, student_id: student.id }),
    );
    return student;
  }

  async assertOwnership(groupId: string, teacherId: string): Promise<GroupOrmEntity> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException("GROUP_NOT_FOUND");
    if (group.teacher_id !== teacherId) throw new ForbiddenException("NOT_GROUP_OWNER");
    return group;
  }
}

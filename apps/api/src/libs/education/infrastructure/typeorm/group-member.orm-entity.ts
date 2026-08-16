import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { MemberSource } from "../../config/education.enums";

@Entity("group_members")
export class GroupMemberOrmEntity {
  @PrimaryColumn({ type: "uuid" })
  group_id: string;

  @Index()
  @PrimaryColumn({ type: "uuid" })
  student_id: string;

  @Column({ type: "text", default: MemberSource.TEACHER })
  source: MemberSource;

  @CreateDateColumn({ type: "timestamptz" })
  joined_at: Date;
}

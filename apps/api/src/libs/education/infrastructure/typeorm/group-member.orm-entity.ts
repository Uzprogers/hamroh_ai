import { CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("group_members")
export class GroupMemberOrmEntity {
  @PrimaryColumn({ type: "uuid" })
  group_id: string;

  @Index()
  @PrimaryColumn({ type: "uuid" })
  student_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  joined_at: Date;
}

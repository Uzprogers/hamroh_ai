import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { InstitutionType } from "../../../identity/config/identity.enums";

@Entity("groups")
export class GroupOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  teacher_id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  subject: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 8 })
  code: string;

  @Column({ type: "text" })
  institution_type: InstitutionType;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}

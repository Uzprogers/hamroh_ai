import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("submissions")
@Unique(["assignment_id", "student_id"])
export class SubmissionOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  assignment_id: string;

  @Index()
  @Column({ type: "uuid" })
  student_id: string;

  @Column({ type: "text", nullable: true })
  text: string | null;

  @Column({ type: "text", nullable: true })
  audio_path: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  submitted_at: Date;
}

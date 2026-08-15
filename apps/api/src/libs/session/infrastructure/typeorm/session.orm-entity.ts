import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("sessions")
export class SessionOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  student_id: string;

  @Column({ type: "uuid", nullable: true })
  lesson_id: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  started_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  ended_at: Date | null;

  @Column({ type: "text", nullable: true })
  summary: string | null;
}

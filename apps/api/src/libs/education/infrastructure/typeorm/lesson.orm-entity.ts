import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { LessonStatus } from "../../config/education.enums";

export interface PlanStep {
  title: string;
  description: string;
  minutes: number;
}

@Entity("lessons")
export class LessonOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  group_id: string;

  @Column({ type: "uuid" })
  teacher_id: string;

  @Column({ type: "text" })
  topic: string;

  @Column({ type: "text", nullable: true })
  objective: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  plan: PlanStep[];

  @Column({ type: "text", default: LessonStatus.DRAFT })
  status: LessonStatus;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}

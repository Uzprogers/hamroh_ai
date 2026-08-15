import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { AssignmentType } from "../../config/education.enums";

export interface Criterion {
  name: string;
  weight: number;
  description: string;
}

@Entity("assignments")
export class AssignmentOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  lesson_id: string;

  @Column({ type: "text" })
  type: AssignmentType;

  @Column({ type: "text" })
  question: string;

  @Column({ type: "text", nullable: true })
  expected_answer: string | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  criteria: Criterion[];

  @Column({ type: "int", default: 10 })
  max_score: number;

  @Column({ type: "int", default: 0 })
  order_index: number;
}

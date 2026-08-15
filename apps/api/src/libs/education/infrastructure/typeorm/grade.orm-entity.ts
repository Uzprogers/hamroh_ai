import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { ErrorSeverity } from "../../config/education.enums";

export interface MistakeItem {
  fragment: string;
  correction: string;
  explanation: string;
  severity: ErrorSeverity;
}

export interface CriterionResult {
  name: string;
  score: number;
  max: number;
  comment: string;
}

@Entity("grades")
export class GradeOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  submission_id: string;

  @Column({ type: "numeric", precision: 5, scale: 2 })
  score: string;

  @Column({ type: "int" })
  max_score: number;

  @Column({ type: "text" })
  feedback: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  mistakes: MistakeItem[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  criteria_results: CriterionResult[];

  @Column({ type: "text" })
  ai_model: string;

  @Column({ type: "boolean", default: false })
  teacher_approved: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  graded_at: Date;
}

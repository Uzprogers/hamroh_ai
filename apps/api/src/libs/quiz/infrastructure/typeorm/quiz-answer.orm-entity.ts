import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

@Entity("quiz_answers")
@Unique(["session_id", "student_id", "question_index"])
export class QuizAnswerOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  session_id: string;

  @Column({ type: "uuid" })
  student_id: string;

  @Column({ type: "int" })
  question_index: number;

  @Column({ type: "int" })
  option_index: number;

  @Column({ type: "boolean", default: false })
  correct: boolean;

  @Column({ type: "int", default: 0 })
  elapsed_ms: number;

  @Column({ type: "int", default: 0 })
  score: number;

  @CreateDateColumn({ type: "timestamptz" })
  answered_at: Date;
}

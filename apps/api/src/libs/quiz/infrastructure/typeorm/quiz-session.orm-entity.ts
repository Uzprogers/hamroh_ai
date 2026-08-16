import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { QuizGeneration, QuizStatus } from "../../config/quiz.enums";
import { QuizQuestion } from "../../application/types/quiz.types";

@Entity("quiz_sessions")
export class QuizSessionOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  lesson_id: string;

  @Index()
  @Column({ type: "uuid" })
  teacher_id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 6 })
  pin: string;

  @Column({ type: "text", default: QuizStatus.LOBBY })
  status: QuizStatus;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  questions: QuizQuestion[];

  @Column({ type: "text", default: QuizGeneration.READY })
  generation: QuizGeneration;

  @Column({ type: "int", default: 0 })
  current_index: number;

  @Column({ type: "timestamptz", nullable: true })
  started_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  ended_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}

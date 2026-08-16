import { MigrationInterface, QueryRunner } from "typeorm";

export class QuizSessions1786300000000 implements MigrationInterface {
  name = "QuizSessions1786300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE quiz_sessions (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id     uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        teacher_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pin           varchar(6) NOT NULL,
        status        text NOT NULL DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'RUNNING', 'ENDED')),
        questions     jsonb NOT NULL DEFAULT '[]'::jsonb,
        current_index integer NOT NULL DEFAULT 0,
        started_at    timestamptz,
        ended_at      timestamptz,
        created_at    timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_quiz_sessions_pin ON quiz_sessions (pin)`);
    await queryRunner.query(
      `CREATE INDEX idx_quiz_sessions_lesson ON quiz_sessions (lesson_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_quiz_sessions_teacher ON quiz_sessions (teacher_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE quiz_answers (
        id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id     uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
        student_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_index integer NOT NULL,
        option_index   integer NOT NULL,
        correct        boolean NOT NULL DEFAULT false,
        elapsed_ms     integer NOT NULL DEFAULT 0,
        score          integer NOT NULL DEFAULT 0,
        answered_at    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_quiz_answers_slot UNIQUE (session_id, student_id, question_index)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_quiz_answers_session ON quiz_answers (session_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_answers`);
    await queryRunner.query(`DROP TABLE IF EXISTS quiz_sessions`);
  }
}

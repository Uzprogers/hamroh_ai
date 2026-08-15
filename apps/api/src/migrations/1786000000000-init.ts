import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1786000000000 implements MigrationInterface {
  name = "Init1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE users (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name       text NOT NULL,
        last_name        text NOT NULL,
        phone            text NOT NULL,
        password_hash    text NOT NULL,
        role             text NOT NULL CHECK (role IN ('TEACHER', 'STUDENT')),
        institution_type text NOT NULL CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY')),
        institution_name text NOT NULL,
        grade_level      text,
        locale           text NOT NULL DEFAULT 'uz' CHECK (locale IN ('uz', 'ru', 'en')),
        created_at       timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_users_phone ON users (phone)`);

    await queryRunner.query(`
      CREATE TABLE groups (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name             text NOT NULL,
        subject          text NOT NULL,
        institution_type text NOT NULL CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY')),
        created_at       timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_groups_teacher ON groups (teacher_id)`);

    await queryRunner.query(`
      CREATE TABLE group_members (
        group_id   uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (group_id, student_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_group_members_student ON group_members (student_id)`);

    await queryRunner.query(`
      CREATE TABLE lessons (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id   uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic      text NOT NULL,
        objective  text,
        plan       jsonb NOT NULL DEFAULT '[]'::jsonb,
        status     text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_lessons_group ON lessons (group_id)`);

    await queryRunner.query(`
      CREATE TABLE assignments (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id       uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        type            text NOT NULL CHECK (type IN ('WRITTEN', 'QUIZ', 'SPEAKING')),
        question        text NOT NULL,
        expected_answer text,
        criteria        jsonb NOT NULL DEFAULT '[]'::jsonb,
        max_score       integer NOT NULL DEFAULT 10,
        order_index     integer NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_assignments_lesson ON assignments (lesson_id)`);

    await queryRunner.query(`
      CREATE TABLE submissions (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        student_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text          text,
        audio_path    text,
        submitted_at  timestamptz NOT NULL DEFAULT now(),
        UNIQUE (assignment_id, student_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_submissions_student ON submissions (student_id)`);
    await queryRunner.query(`CREATE INDEX idx_submissions_assignment ON submissions (assignment_id)`);

    await queryRunner.query(`
      CREATE TABLE grades (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id    uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        score            numeric(5, 2) NOT NULL,
        max_score        integer NOT NULL,
        feedback         text NOT NULL,
        mistakes         jsonb NOT NULL DEFAULT '[]'::jsonb,
        criteria_results jsonb NOT NULL DEFAULT '[]'::jsonb,
        ai_model         text NOT NULL,
        teacher_approved boolean NOT NULL DEFAULT false,
        graded_at        timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_grades_submission ON grades (submission_id)`);

    await queryRunner.query(`
      CREATE TABLE sessions (
        id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id  uuid REFERENCES lessons(id) ON DELETE SET NULL,
        started_at timestamptz NOT NULL DEFAULT now(),
        ended_at   timestamptz,
        summary    text
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_sessions_student ON sessions (student_id)`);

    await queryRunner.query(`
      CREATE TABLE session_messages (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        sender      text NOT NULL CHECK (sender IN ('STUDENT', 'HAMROH', 'TOOL')),
        text        text,
        tool_name   text,
        tool_result jsonb,
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_session_messages_session ON session_messages (session_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS session_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS grades`);
    await queryRunner.query(`DROP TABLE IF EXISTS submissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS lessons`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS groups`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}

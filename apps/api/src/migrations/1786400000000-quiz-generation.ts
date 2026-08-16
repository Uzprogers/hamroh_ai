import { MigrationInterface, QueryRunner } from "typeorm";

export class QuizGeneration1786400000000 implements MigrationInterface {
  name = "QuizGeneration1786400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE quiz_sessions
      ADD COLUMN generation text NOT NULL DEFAULT 'READY'
      CHECK (generation IN ('PENDING', 'READY', 'FAILED'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE quiz_sessions DROP COLUMN generation`);
  }
}

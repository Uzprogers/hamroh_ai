import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupGrade1786600000000 implements MigrationInterface {
  name = "GroupGrade1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN grade_level int`);
    await queryRunner.query(`
      UPDATE groups
      SET grade_level = NULLIF(substring(name from '^[0-9]+'), '')::int
      WHERE substring(name from '^[0-9]+') <> ''
    `);
    await queryRunner.query(`
      ALTER TABLE groups
      ADD CONSTRAINT chk_groups_grade_level CHECK (grade_level IS NULL OR grade_level BETWEEN 1 AND 16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE groups DROP CONSTRAINT chk_groups_grade_level`);
    await queryRunner.query(`ALTER TABLE groups DROP COLUMN grade_level`);
  }
}

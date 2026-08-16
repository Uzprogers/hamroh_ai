import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupJoin1786500000000 implements MigrationInterface {
  name = "GroupJoin1786500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN code varchar(8)`);
    await queryRunner.query(`
      UPDATE groups
      SET code = upper(substr(md5(random()::text || id::text), 1, 6))
    `);
    await queryRunner.query(`ALTER TABLE groups ALTER COLUMN code SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_groups_code ON groups (code)`);

    await queryRunner.query(`
      ALTER TABLE group_members
      ADD COLUMN source text NOT NULL DEFAULT 'TEACHER'
      CHECK (source IN ('TEACHER', 'PIN', 'CODE', 'SCHOOL'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE group_members DROP COLUMN source`);
    await queryRunner.query(`DROP INDEX idx_groups_code`);
    await queryRunner.query(`ALTER TABLE groups DROP COLUMN code`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class TutoringInstitution1786200000000 implements MigrationInterface {
  name = "TutoringInstitution1786200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_institution_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_institution_type_check
        CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY', 'TUTORING'))
    `);

    await queryRunner.query(`
      ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_institution_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE groups
        ADD CONSTRAINT groups_institution_type_check
        CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY', 'TUTORING'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_institution_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE groups
        ADD CONSTRAINT groups_institution_type_check
        CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY'))
    `);

    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_institution_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_institution_type_check
        CHECK (institution_type IN ('SCHOOL', 'UNIVERSITY'))
    `);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class SingleMembership1786700000000 implements MigrationInterface {
  name = "SingleMembership1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM group_members m
      USING group_members keep
      WHERE m.student_id = keep.student_id
        AND (keep.joined_at, keep.group_id) > (m.joined_at, m.group_id)
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_members_student`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_group_members_student ON group_members (student_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_group_members_student`);
    await queryRunner.query(`CREATE INDEX idx_group_members_student ON group_members (student_id)`);
  }
}

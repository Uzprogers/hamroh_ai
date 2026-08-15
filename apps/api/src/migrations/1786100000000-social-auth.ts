import { MigrationInterface, QueryRunner } from "typeorm";

export class SocialAuth1786100000000 implements MigrationInterface {
  name = "SocialAuth1786100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ALTER COLUMN last_name DROP NOT NULL,
        ALTER COLUMN phone DROP NOT NULL,
        ALTER COLUMN password_hash DROP NOT NULL,
        ALTER COLUMN role DROP NOT NULL,
        ALTER COLUMN institution_type DROP NOT NULL,
        ALTER COLUMN institution_name DROP NOT NULL,
        ADD COLUMN email text,
        ADD COLUMN google_id text,
        ADD COLUMN telegram_id text,
        ADD COLUMN auth_provider text NOT NULL DEFAULT 'LOCAL',
        ADD COLUMN avatar_url text,
        ADD COLUMN subject text,
        ADD COLUMN profile_completed boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_auth_provider_check
        CHECK (auth_provider IN ('LOCAL', 'GOOGLE', 'TELEGRAM'))
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX users_email_uq ON users (email)`);
    await queryRunner.query(`CREATE UNIQUE INDEX users_google_id_uq ON users (google_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX users_telegram_id_uq ON users (telegram_id)`);

    await queryRunner.query(`
      CREATE TABLE telegram_logins (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL,
        status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'EXPIRED')),
        user_id uuid REFERENCES users (id) ON DELETE CASCADE,
        locale text NOT NULL DEFAULT 'uz' CHECK (locale IN ('uz', 'ru', 'en')),
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX telegram_logins_code_uq ON telegram_logins (code)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE telegram_logins`);
    await queryRunner.query(`DROP INDEX users_telegram_id_uq`);
    await queryRunner.query(`DROP INDEX users_google_id_uq`);
    await queryRunner.query(`DROP INDEX users_email_uq`);
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT users_auth_provider_check`);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN profile_completed,
        DROP COLUMN subject,
        DROP COLUMN avatar_url,
        DROP COLUMN auth_provider,
        DROP COLUMN telegram_id,
        DROP COLUMN google_id,
        DROP COLUMN email
    `);
  }
}

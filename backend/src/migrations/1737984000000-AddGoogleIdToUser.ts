import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUser1737984000000 implements MigrationInterface {
  name = 'AddGoogleIdToUser1737984000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "googleId" character varying,
      ADD CONSTRAINT IF NOT EXISTS "UQ_users_googleId" UNIQUE ("googleId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT IF EXISTS "UQ_users_googleId",
      DROP COLUMN IF EXISTS "googleId"
    `);
  }
}

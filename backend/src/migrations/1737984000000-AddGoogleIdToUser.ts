import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUser1737984000000 implements MigrationInterface {
  name = 'AddGoogleIdToUser1737984000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "googleId" character varying
    `);

    // Check if constraint exists before adding it
    const constraintExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'UQ_users_googleId' 
      AND table_name = 'users'
    `);

    if (constraintExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT IF EXISTS "UQ_users_googleId",
      DROP COLUMN IF EXISTS "googleId"
    `);
  }
}

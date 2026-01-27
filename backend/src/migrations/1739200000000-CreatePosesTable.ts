import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePosesTable1739200000000 implements MigrationInterface {
  name = 'CreatePosesTable1739200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'poses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'mascotId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'prompt',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'imageUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'figmaFileId',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key to mascots table
    await queryRunner.createForeignKey(
      'poses',
      new TableForeignKey({
        columnNames: ['mascotId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mascots',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on mascotId for faster queries
    await queryRunner.createIndex(
      'poses',
      new TableIndex({
        name: 'IDX_poses_mascotId',
        columnNames: ['mascotId'],
      }),
    );

    // Create index on status for faster filtering
    await queryRunner.createIndex(
      'poses',
      new TableIndex({
        name: 'IDX_poses_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('poses', true);
  }
}

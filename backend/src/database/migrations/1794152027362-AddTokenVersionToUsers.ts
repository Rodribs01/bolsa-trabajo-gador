import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenVersionToUsers1794152027362 implements MigrationInterface {
  name = 'AddTokenVersionToUsers1794152027362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`version_token\` int NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`version_token\``,
    );
  }
}

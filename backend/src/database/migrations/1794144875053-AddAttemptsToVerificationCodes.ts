import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttemptsToVerificationCodes1794144875053 implements MigrationInterface {
  name = 'AddAttemptsToVerificationCodes1794144875053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` ADD \`intentos\` int NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` DROP COLUMN \`intentos\``,
    );
  }
}

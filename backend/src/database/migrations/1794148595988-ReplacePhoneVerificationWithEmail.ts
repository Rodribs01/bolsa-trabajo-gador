import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplacePhoneVerificationWithEmail1794148595988 implements MigrationInterface {
  name = 'ReplacePhoneVerificationWithEmail1794148595988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`celular_verificado\` \`correo_verificado\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` MODIFY \`tipo\` enum ('OTP_CELULAR', 'OTP_CORREO', 'RECUPERACION') NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE \`codigos_verificacion\` SET \`tipo\` = 'OTP_CORREO' WHERE \`tipo\` = 'OTP_CELULAR'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` MODIFY \`tipo\` enum ('OTP_CORREO', 'RECUPERACION') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` MODIFY \`tipo\` enum ('OTP_CELULAR', 'OTP_CORREO', 'RECUPERACION') NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE \`codigos_verificacion\` SET \`tipo\` = 'OTP_CELULAR' WHERE \`tipo\` = 'OTP_CORREO'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` MODIFY \`tipo\` enum ('OTP_CELULAR', 'RECUPERACION') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`correo_verificado\` \`celular_verificado\` tinyint NOT NULL DEFAULT 0`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferSearchIndex1794188379405 implements MigrationInterface {
  name = 'AddOfferSearchIndex1794188379405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_845536785f27cd81cc10eaa9a6\` ON \`ofertas\` (\`estado\`, \`fecha_cierre\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_845536785f27cd81cc10eaa9a6\` ON \`ofertas\``,
    );
  }
}

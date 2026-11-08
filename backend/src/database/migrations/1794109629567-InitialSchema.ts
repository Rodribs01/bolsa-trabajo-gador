import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794109629567 implements MigrationInterface {
  name = 'InitialSchema1794109629567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`catalogos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo\` enum ('RUBRO', 'PROFESION', 'TIPO_CONTRATO', 'MODALIDAD', 'DEPARTAMENTO', 'MUNICIPIO', 'IDIOMA') NOT NULL, \`nombre\` varchar(100) NOT NULL, \`padre_id\` int NULL, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_dffdf56b32676a833d310424f8\` (\`tipo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(30) NOT NULL, \`descripcion\` varchar(150) NULL, UNIQUE INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` (\`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rol_id\` int NOT NULL, \`nombre\` varchar(150) NOT NULL, \`email\` varchar(150) NOT NULL, \`celular\` varchar(20) NULL, \`password\` varchar(255) NOT NULL, \`celular_verificado\` tinyint NOT NULL DEFAULT 0, \`activo\` tinyint NOT NULL DEFAULT 1, \`intentos_fallidos\` int NOT NULL DEFAULT '0', \`bloqueado_hasta\` datetime NULL, \`ultimo_acceso\` datetime NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`habilidades\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(80) NOT NULL, \`categoria\` varchar(60) NULL, \`activo\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_89831c9fc1d969af53d4a831c9\` (\`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`postulante_habilidad\` (\`id\` int NOT NULL AUTO_INCREMENT, \`perfil_postulante_id\` int NOT NULL, \`habilidad_id\` int NOT NULL, \`nivel\` enum ('BASICO', 'INTERMEDIO', 'AVANZADO') NOT NULL, UNIQUE INDEX \`IDX_c9d2220387897d303a35eefa64\` (\`perfil_postulante_id\`, \`habilidad_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`formaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`perfil_postulante_id\` int NOT NULL, \`titulo\` varchar(150) NOT NULL, \`institucion\` varchar(150) NOT NULL, \`anio_titulacion\` smallint NOT NULL, \`nro_titulo_nacional\` varchar(30) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`experiencias\` (\`id\` int NOT NULL AUTO_INCREMENT, \`perfil_postulante_id\` int NOT NULL, \`empresa\` varchar(150) NOT NULL, \`cargo\` varchar(100) NOT NULL, \`lugar\` varchar(100) NULL, \`fecha_inicio\` date NOT NULL, \`fecha_fin\` date NULL, \`anios\` decimal(4,1) NOT NULL DEFAULT '0.0', \`descripcion\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`perfiles_postulante\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NOT NULL, \`ci\` varchar(15) NOT NULL, \`ci_expedido\` varchar(3) NOT NULL, \`nombres\` varchar(80) NOT NULL, \`apellidos\` varchar(80) NOT NULL, \`fecha_nacimiento\` date NULL, \`direccion\` varchar(200) NULL, \`municipio_id\` int NULL, \`profesion_id\` int NULL, \`foto\` varchar(255) NULL, \`cv\` varchar(255) NULL, \`resumen\` text NULL, \`porcentaje_completitud\` int NOT NULL DEFAULT '0', \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_088a0066bae4ec22fdc98cba66\` (\`ci\`), UNIQUE INDEX \`REL_e60ffa3ac54d2ecc02f76cce56\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`postulante_idioma\` (\`id\` int NOT NULL AUTO_INCREMENT, \`perfil_postulante_id\` int NOT NULL, \`idioma_id\` int NOT NULL, \`nivel\` enum ('BASICO', 'INTERMEDIO', 'AVANZADO', 'NATIVO') NOT NULL, UNIQUE INDEX \`IDX_9f18018bdf86e11f91f5b11b00\` (\`perfil_postulante_id\`, \`idioma_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`empresas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NOT NULL, \`nit\` varchar(20) NOT NULL, \`razon_social\` varchar(150) NOT NULL, \`rubro_id\` int NOT NULL, \`representante_legal\` varchar(150) NOT NULL, \`ci_representante\` varchar(15) NOT NULL, \`celular\` varchar(20) NOT NULL, \`email_corporativo\` varchar(150) NOT NULL, \`direccion\` varchar(200) NOT NULL, \`municipio_id\` int NOT NULL, \`numero_trabajadores\` int NULL, \`logo\` varchar(255) NULL, \`documento_respaldo\` varchar(255) NOT NULL, \`descripcion\` text NOT NULL, \`estado\` enum ('PENDIENTE_VALIDACION', 'APROBADA', 'RECHAZADA', 'SUSPENDIDA') NOT NULL DEFAULT 'PENDIENTE_VALIDACION', \`motivo_rechazo\` text NULL, \`validado_por\` int NULL, \`validado_en\` datetime NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_3815a71fa4034941beaf005118\` (\`nit\`), UNIQUE INDEX \`REL_e1da4a659a3ca7cd9f01164bee\` (\`usuario_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`oferta_profesion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`oferta_id\` int NOT NULL, \`profesion_id\` int NOT NULL, UNIQUE INDEX \`IDX_0486edcb0ad7718596084ab0bd\` (\`oferta_id\`, \`profesion_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`oferta_habilidad\` (\`id\` int NOT NULL AUTO_INCREMENT, \`oferta_id\` int NOT NULL, \`habilidad_id\` int NOT NULL, \`obligatoria\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_840081c7530740767089938e67\` (\`oferta_id\`, \`habilidad_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ofertas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`empresa_id\` int NOT NULL, \`titulo\` varchar(150) NOT NULL, \`descripcion\` text NOT NULL, \`requisitos_obligatorios\` text NOT NULL, \`requisitos_deseables\` text NULL, \`anios_experiencia\` int NOT NULL DEFAULT '0', \`tipo_contrato_id\` int NOT NULL, \`modalidad_id\` int NOT NULL, \`municipio_id\` int NOT NULL, \`salario_min\` decimal(10,2) NULL, \`salario_max\` decimal(10,2) NULL, \`salario_a_tratar\` tinyint NOT NULL DEFAULT 0, \`beneficios\` text NULL, \`fecha_cierre\` date NOT NULL, \`numero_plazas\` int NOT NULL DEFAULT '1', \`estado\` enum ('BORRADOR', 'EN_REVISION_GADOR', 'PUBLICADA', 'EN_PROCESO_SELECCION', 'CERRADA', 'ANULADA') NOT NULL DEFAULT 'BORRADOR', \`observacion\` text NULL, \`total_vistas\` int NOT NULL DEFAULT '0', \`oferta_origen_id\` int NULL, \`publicado_en\` datetime NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`postulaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`oferta_id\` int NOT NULL, \`perfil_postulante_id\` int NOT NULL, \`estado\` enum ('POSTULADO', 'VISTO', 'PRESELECCIONADO', 'ENTREVISTA', 'FINALISTA', 'CONTRATADO', 'RECHAZADO', 'RETIRADO') NOT NULL DEFAULT 'POSTULADO', \`porcentaje_match\` int NOT NULL DEFAULT '0', \`visto_en\` datetime NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8c1cc3f116feb593432f590cd0\` (\`oferta_id\`, \`perfil_postulante_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auditoria\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NULL, \`accion\` enum ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CHANGE_STATUS') NOT NULL, \`tabla\` varchar(60) NOT NULL, \`registro_id\` int NULL, \`datos_anteriores\` json NULL, \`datos_nuevos\` json NULL, \`ip\` varchar(45) NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`codigos_verificacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NOT NULL, \`tipo\` enum ('OTP_CELULAR', 'RECUPERACION') NOT NULL, \`codigo_hash\` varchar(255) NOT NULL, \`expira_en\` datetime NOT NULL, \`usado\` tinyint NOT NULL DEFAULT 0, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`configuraciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`clave\` varchar(60) NOT NULL, \`valor\` varchar(255) NOT NULL, \`descripcion\` varchar(200) NULL, UNIQUE INDEX \`IDX_343e7df00b49bc3cc71d54c98d\` (\`clave\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`favoritos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`perfil_postulante_id\` int NOT NULL, \`oferta_id\` int NOT NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_19da086ad47d80f5831cddec44\` (\`perfil_postulante_id\`, \`oferta_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notificaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NOT NULL, \`tipo\` enum ('CV_VISTO', 'CAMBIO_ESTADO_POSTULACION', 'EMPRESA_VALIDADA', 'OFERTA_POR_VENCER', 'NUEVA_OFERTA') NOT NULL, \`titulo\` varchar(150) NOT NULL, \`mensaje\` varchar(500) NOT NULL, \`enlace\` varchar(255) NULL, \`leida\` tinyint NOT NULL DEFAULT 0, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`suscripciones_push\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuario_id\` int NOT NULL, \`endpoint\` varchar(500) NOT NULL, \`p256dh\` varchar(255) NOT NULL, \`auth\` varchar(255) NOT NULL, \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2a94f1283f8129f8e46a172d16\` (\`endpoint\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`catalogos\` ADD CONSTRAINT \`FK_d58aa552df79b1d12bf9e15a7a3\` FOREIGN KEY (\`padre_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_9e519760a660751f4fa21453d3e\` FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_habilidad\` ADD CONSTRAINT \`FK_78fb7c11713535f69aa0e9d3bcb\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_habilidad\` ADD CONSTRAINT \`FK_7c960afc3dd3912dc62707e3b8c\` FOREIGN KEY (\`habilidad_id\`) REFERENCES \`habilidades\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`formaciones\` ADD CONSTRAINT \`FK_efece01923cc94e78066208cdd6\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`experiencias\` ADD CONSTRAINT \`FK_258a779d028bd3c51f5814d5f52\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` ADD CONSTRAINT \`FK_e60ffa3ac54d2ecc02f76cce561\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` ADD CONSTRAINT \`FK_03b096e35d56bf0c71fc38c1204\` FOREIGN KEY (\`municipio_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` ADD CONSTRAINT \`FK_0288f84748fa607592f559763dd\` FOREIGN KEY (\`profesion_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_idioma\` ADD CONSTRAINT \`FK_0f0673ffcb8e8238b4fd4c31905\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_idioma\` ADD CONSTRAINT \`FK_876cff8702aebd617a28c09dbb4\` FOREIGN KEY (\`idioma_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` ADD CONSTRAINT \`FK_e1da4a659a3ca7cd9f01164bee6\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` ADD CONSTRAINT \`FK_6d70d2be95c2d23a1a69fe7b643\` FOREIGN KEY (\`rubro_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` ADD CONSTRAINT \`FK_f41f4483d2103816acfa2815b39\` FOREIGN KEY (\`municipio_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` ADD CONSTRAINT \`FK_df4ae7fc339b1475ea3015a8c1a\` FOREIGN KEY (\`validado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_profesion\` ADD CONSTRAINT \`FK_412f6159659f17371835afb55d7\` FOREIGN KEY (\`oferta_id\`) REFERENCES \`ofertas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_profesion\` ADD CONSTRAINT \`FK_a5d70837e2113b0a678d0f4d0f6\` FOREIGN KEY (\`profesion_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_habilidad\` ADD CONSTRAINT \`FK_42358f3a43181d7a2ecedbe2de3\` FOREIGN KEY (\`oferta_id\`) REFERENCES \`ofertas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_habilidad\` ADD CONSTRAINT \`FK_f9848b38058a2bbb3fe4da34c22\` FOREIGN KEY (\`habilidad_id\`) REFERENCES \`habilidades\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` ADD CONSTRAINT \`FK_3e3c112a192c6ed06efa32ba593\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` ADD CONSTRAINT \`FK_6d78b5dcd5c1d019cc597f0342c\` FOREIGN KEY (\`tipo_contrato_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` ADD CONSTRAINT \`FK_02a9301f7709ab2a834d2ef2e50\` FOREIGN KEY (\`modalidad_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` ADD CONSTRAINT \`FK_723b166306d599a40c43c62c188\` FOREIGN KEY (\`municipio_id\`) REFERENCES \`catalogos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` ADD CONSTRAINT \`FK_9769718e948035fd33f1ac8fdab\` FOREIGN KEY (\`oferta_origen_id\`) REFERENCES \`ofertas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulaciones\` ADD CONSTRAINT \`FK_daa720af7330aa5803048361675\` FOREIGN KEY (\`oferta_id\`) REFERENCES \`ofertas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulaciones\` ADD CONSTRAINT \`FK_db4ec97f4235c8f616d9a0bd5b1\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria\` ADD CONSTRAINT \`FK_e3351946be53c7cd3286ed4c49d\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` ADD CONSTRAINT \`FK_fe60bbab8cf22166ae0a59626eb\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favoritos\` ADD CONSTRAINT \`FK_81dd7dad30bc667aa519c848aa3\` FOREIGN KEY (\`perfil_postulante_id\`) REFERENCES \`perfiles_postulante\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favoritos\` ADD CONSTRAINT \`FK_39a4487afb2613ac1ce84e385e1\` FOREIGN KEY (\`oferta_id\`) REFERENCES \`ofertas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notificaciones\` ADD CONSTRAINT \`FK_2c6341d5bd206ff522b35aa6b69\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`suscripciones_push\` ADD CONSTRAINT \`FK_c129ad13166bbc967a581beaf6f\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`suscripciones_push\` DROP FOREIGN KEY \`FK_c129ad13166bbc967a581beaf6f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notificaciones\` DROP FOREIGN KEY \`FK_2c6341d5bd206ff522b35aa6b69\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`favoritos\` DROP FOREIGN KEY \`FK_39a4487afb2613ac1ce84e385e1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`favoritos\` DROP FOREIGN KEY \`FK_81dd7dad30bc667aa519c848aa3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`codigos_verificacion\` DROP FOREIGN KEY \`FK_fe60bbab8cf22166ae0a59626eb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auditoria\` DROP FOREIGN KEY \`FK_e3351946be53c7cd3286ed4c49d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulaciones\` DROP FOREIGN KEY \`FK_db4ec97f4235c8f616d9a0bd5b1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulaciones\` DROP FOREIGN KEY \`FK_daa720af7330aa5803048361675\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` DROP FOREIGN KEY \`FK_9769718e948035fd33f1ac8fdab\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` DROP FOREIGN KEY \`FK_723b166306d599a40c43c62c188\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` DROP FOREIGN KEY \`FK_02a9301f7709ab2a834d2ef2e50\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` DROP FOREIGN KEY \`FK_6d78b5dcd5c1d019cc597f0342c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ofertas\` DROP FOREIGN KEY \`FK_3e3c112a192c6ed06efa32ba593\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_habilidad\` DROP FOREIGN KEY \`FK_f9848b38058a2bbb3fe4da34c22\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_habilidad\` DROP FOREIGN KEY \`FK_42358f3a43181d7a2ecedbe2de3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_profesion\` DROP FOREIGN KEY \`FK_a5d70837e2113b0a678d0f4d0f6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`oferta_profesion\` DROP FOREIGN KEY \`FK_412f6159659f17371835afb55d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP FOREIGN KEY \`FK_df4ae7fc339b1475ea3015a8c1a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP FOREIGN KEY \`FK_f41f4483d2103816acfa2815b39\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP FOREIGN KEY \`FK_6d70d2be95c2d23a1a69fe7b643\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP FOREIGN KEY \`FK_e1da4a659a3ca7cd9f01164bee6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_idioma\` DROP FOREIGN KEY \`FK_876cff8702aebd617a28c09dbb4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_idioma\` DROP FOREIGN KEY \`FK_0f0673ffcb8e8238b4fd4c31905\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` DROP FOREIGN KEY \`FK_0288f84748fa607592f559763dd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` DROP FOREIGN KEY \`FK_03b096e35d56bf0c71fc38c1204\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`perfiles_postulante\` DROP FOREIGN KEY \`FK_e60ffa3ac54d2ecc02f76cce561\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`experiencias\` DROP FOREIGN KEY \`FK_258a779d028bd3c51f5814d5f52\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`formaciones\` DROP FOREIGN KEY \`FK_efece01923cc94e78066208cdd6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_habilidad\` DROP FOREIGN KEY \`FK_7c960afc3dd3912dc62707e3b8c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`postulante_habilidad\` DROP FOREIGN KEY \`FK_78fb7c11713535f69aa0e9d3bcb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_9e519760a660751f4fa21453d3e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`catalogos\` DROP FOREIGN KEY \`FK_d58aa552df79b1d12bf9e15a7a3\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2a94f1283f8129f8e46a172d16\` ON \`suscripciones_push\``,
    );
    await queryRunner.query(`DROP TABLE \`suscripciones_push\``);
    await queryRunner.query(`DROP TABLE \`notificaciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_19da086ad47d80f5831cddec44\` ON \`favoritos\``,
    );
    await queryRunner.query(`DROP TABLE \`favoritos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_343e7df00b49bc3cc71d54c98d\` ON \`configuraciones\``,
    );
    await queryRunner.query(`DROP TABLE \`configuraciones\``);
    await queryRunner.query(`DROP TABLE \`codigos_verificacion\``);
    await queryRunner.query(`DROP TABLE \`auditoria\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8c1cc3f116feb593432f590cd0\` ON \`postulaciones\``,
    );
    await queryRunner.query(`DROP TABLE \`postulaciones\``);
    await queryRunner.query(`DROP TABLE \`ofertas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_840081c7530740767089938e67\` ON \`oferta_habilidad\``,
    );
    await queryRunner.query(`DROP TABLE \`oferta_habilidad\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0486edcb0ad7718596084ab0bd\` ON \`oferta_profesion\``,
    );
    await queryRunner.query(`DROP TABLE \`oferta_profesion\``);
    await queryRunner.query(
      `DROP INDEX \`REL_e1da4a659a3ca7cd9f01164bee\` ON \`empresas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3815a71fa4034941beaf005118\` ON \`empresas\``,
    );
    await queryRunner.query(`DROP TABLE \`empresas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9f18018bdf86e11f91f5b11b00\` ON \`postulante_idioma\``,
    );
    await queryRunner.query(`DROP TABLE \`postulante_idioma\``);
    await queryRunner.query(
      `DROP INDEX \`REL_e60ffa3ac54d2ecc02f76cce56\` ON \`perfiles_postulante\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_088a0066bae4ec22fdc98cba66\` ON \`perfiles_postulante\``,
    );
    await queryRunner.query(`DROP TABLE \`perfiles_postulante\``);
    await queryRunner.query(`DROP TABLE \`experiencias\``);
    await queryRunner.query(`DROP TABLE \`formaciones\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c9d2220387897d303a35eefa64\` ON \`postulante_habilidad\``,
    );
    await queryRunner.query(`DROP TABLE \`postulante_habilidad\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_89831c9fc1d969af53d4a831c9\` ON \`habilidades\``,
    );
    await queryRunner.query(`DROP TABLE \`habilidades\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a5be7aa67e759e347b1c6464e1\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_dffdf56b32676a833d310424f8\` ON \`catalogos\``,
    );
    await queryRunner.query(`DROP TABLE \`catalogos\``);
  }
}

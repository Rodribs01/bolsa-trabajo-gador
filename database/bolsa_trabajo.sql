-- Bolsa de Trabajo Departamental Digital - G.A.D.OR.
-- Estructura y datos iniciales. El administrador se crea con "npm run seed" (ver README).

CREATE DATABASE IF NOT EXISTS `bolsa_trabajo` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bolsa_trabajo`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `auditoria`;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` enum('CREATE','UPDATE','DELETE','LOGIN','CHANGE_STATUS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registro_id` int DEFAULT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_e3351946be53c7cd3286ed4c49d` (`usuario_id`),
  CONSTRAINT `FK_e3351946be53c7cd3286ed4c49d` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `catalogos`;
CREATE TABLE `catalogos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('RUBRO','PROFESION','TIPO_CONTRATO','MODALIDAD','DEPARTAMENTO','MUNICIPIO','IDIOMA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `padre_id` int DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `activo` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `IDX_dffdf56b32676a833d310424f8` (`tipo`),
  KEY `FK_d58aa552df79b1d12bf9e15a7a3` (`padre_id`),
  CONSTRAINT `FK_d58aa552df79b1d12bf9e15a7a3` FOREIGN KEY (`padre_id`) REFERENCES `catalogos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `codigos_verificacion`;
CREATE TABLE `codigos_verificacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` enum('OTP_CORREO','RECUPERACION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expira_en` datetime NOT NULL,
  `usado` tinyint NOT NULL DEFAULT '0',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `intentos` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_fe60bbab8cf22166ae0a59626eb` (`usuario_id`),
  CONSTRAINT `FK_fe60bbab8cf22166ae0a59626eb` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `configuraciones`;
CREATE TABLE `configuraciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_343e7df00b49bc3cc71d54c98d` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `razon_social` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rubro_id` int NOT NULL,
  `representante_legal` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci_representante` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_corporativo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `municipio_id` int NOT NULL,
  `numero_trabajadores` int DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento_respaldo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('PENDIENTE_VALIDACION','APROBADA','RECHAZADA','SUSPENDIDA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `validado_por` int DEFAULT NULL,
  `validado_en` datetime DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_3815a71fa4034941beaf005118` (`nit`),
  UNIQUE KEY `REL_e1da4a659a3ca7cd9f01164bee` (`usuario_id`),
  KEY `FK_6d70d2be95c2d23a1a69fe7b643` (`rubro_id`),
  KEY `FK_f41f4483d2103816acfa2815b39` (`municipio_id`),
  KEY `FK_df4ae7fc339b1475ea3015a8c1a` (`validado_por`),
  CONSTRAINT `FK_6d70d2be95c2d23a1a69fe7b643` FOREIGN KEY (`rubro_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_df4ae7fc339b1475ea3015a8c1a` FOREIGN KEY (`validado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `FK_e1da4a659a3ca7cd9f01164bee6` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `FK_f41f4483d2103816acfa2815b39` FOREIGN KEY (`municipio_id`) REFERENCES `catalogos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `experiencias`;
CREATE TABLE `experiencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_postulante_id` int NOT NULL,
  `empresa` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lugar` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `anios` decimal(4,1) NOT NULL DEFAULT '0.0',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `FK_258a779d028bd3c51f5814d5f52` (`perfil_postulante_id`),
  CONSTRAINT `FK_258a779d028bd3c51f5814d5f52` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `favoritos`;
CREATE TABLE `favoritos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_postulante_id` int NOT NULL,
  `oferta_id` int NOT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_19da086ad47d80f5831cddec44` (`perfil_postulante_id`,`oferta_id`),
  KEY `FK_39a4487afb2613ac1ce84e385e1` (`oferta_id`),
  CONSTRAINT `FK_39a4487afb2613ac1ce84e385e1` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_81dd7dad30bc667aa519c848aa3` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `formaciones`;
CREATE TABLE `formaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_postulante_id` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institucion` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio_titulacion` smallint NOT NULL,
  `nro_titulo_nacional` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_efece01923cc94e78066208cdd6` (`perfil_postulante_id`),
  CONSTRAINT `FK_efece01923cc94e78066208cdd6` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `habilidades`;
CREATE TABLE `habilidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_89831c9fc1d969af53d4a831c9` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` enum('CV_VISTO','CAMBIO_ESTADO_POSTULACION','EMPRESA_VALIDADA','OFERTA_POR_VENCER','NUEVA_OFERTA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enlace` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leida` tinyint NOT NULL DEFAULT '0',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_2c6341d5bd206ff522b35aa6b69` (`usuario_id`),
  CONSTRAINT `FK_2c6341d5bd206ff522b35aa6b69` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oferta_habilidad`;
CREATE TABLE `oferta_habilidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oferta_id` int NOT NULL,
  `habilidad_id` int NOT NULL,
  `obligatoria` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_840081c7530740767089938e67` (`oferta_id`,`habilidad_id`),
  KEY `FK_f9848b38058a2bbb3fe4da34c22` (`habilidad_id`),
  CONSTRAINT `FK_42358f3a43181d7a2ecedbe2de3` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_f9848b38058a2bbb3fe4da34c22` FOREIGN KEY (`habilidad_id`) REFERENCES `habilidades` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oferta_profesion`;
CREATE TABLE `oferta_profesion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oferta_id` int NOT NULL,
  `profesion_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_0486edcb0ad7718596084ab0bd` (`oferta_id`,`profesion_id`),
  KEY `FK_a5d70837e2113b0a678d0f4d0f6` (`profesion_id`),
  CONSTRAINT `FK_412f6159659f17371835afb55d7` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_a5d70837e2113b0a678d0f4d0f6` FOREIGN KEY (`profesion_id`) REFERENCES `catalogos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ofertas`;
CREATE TABLE `ofertas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitos_obligatorios` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitos_deseables` text COLLATE utf8mb4_unicode_ci,
  `anios_experiencia` int NOT NULL DEFAULT '0',
  `tipo_contrato_id` int NOT NULL,
  `modalidad_id` int NOT NULL,
  `municipio_id` int NOT NULL,
  `salario_min` decimal(10,2) DEFAULT NULL,
  `salario_max` decimal(10,2) DEFAULT NULL,
  `salario_a_tratar` tinyint NOT NULL DEFAULT '0',
  `beneficios` text COLLATE utf8mb4_unicode_ci,
  `fecha_cierre` date NOT NULL,
  `numero_plazas` int NOT NULL DEFAULT '1',
  `estado` enum('BORRADOR','EN_REVISION_GADOR','PUBLICADA','EN_PROCESO_SELECCION','CERRADA','ANULADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BORRADOR',
  `observacion` text COLLATE utf8mb4_unicode_ci,
  `total_vistas` int NOT NULL DEFAULT '0',
  `oferta_origen_id` int DEFAULT NULL,
  `publicado_en` datetime DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_3e3c112a192c6ed06efa32ba593` (`empresa_id`),
  KEY `FK_6d78b5dcd5c1d019cc597f0342c` (`tipo_contrato_id`),
  KEY `FK_02a9301f7709ab2a834d2ef2e50` (`modalidad_id`),
  KEY `FK_723b166306d599a40c43c62c188` (`municipio_id`),
  KEY `FK_9769718e948035fd33f1ac8fdab` (`oferta_origen_id`),
  KEY `IDX_845536785f27cd81cc10eaa9a6` (`estado`,`fecha_cierre`),
  CONSTRAINT `FK_02a9301f7709ab2a834d2ef2e50` FOREIGN KEY (`modalidad_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_3e3c112a192c6ed06efa32ba593` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `FK_6d78b5dcd5c1d019cc597f0342c` FOREIGN KEY (`tipo_contrato_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_723b166306d599a40c43c62c188` FOREIGN KEY (`municipio_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_9769718e948035fd33f1ac8fdab` FOREIGN KEY (`oferta_origen_id`) REFERENCES `ofertas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `perfiles_postulante`;
CREATE TABLE `perfiles_postulante` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `ci` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci_expedido` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `municipio_id` int DEFAULT NULL,
  `profesion_id` int DEFAULT NULL,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resumen` text COLLATE utf8mb4_unicode_ci,
  `porcentaje_completitud` int NOT NULL DEFAULT '0',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_088a0066bae4ec22fdc98cba66` (`ci`),
  UNIQUE KEY `REL_e60ffa3ac54d2ecc02f76cce56` (`usuario_id`),
  KEY `FK_03b096e35d56bf0c71fc38c1204` (`municipio_id`),
  KEY `FK_0288f84748fa607592f559763dd` (`profesion_id`),
  CONSTRAINT `FK_0288f84748fa607592f559763dd` FOREIGN KEY (`profesion_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_03b096e35d56bf0c71fc38c1204` FOREIGN KEY (`municipio_id`) REFERENCES `catalogos` (`id`),
  CONSTRAINT `FK_e60ffa3ac54d2ecc02f76cce561` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `postulaciones`;
CREATE TABLE `postulaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oferta_id` int NOT NULL,
  `perfil_postulante_id` int NOT NULL,
  `estado` enum('POSTULADO','VISTO','PRESELECCIONADO','ENTREVISTA','FINALISTA','CONTRATADO','RECHAZADO','RETIRADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POSTULADO',
  `porcentaje_match` int NOT NULL DEFAULT '0',
  `visto_en` datetime DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8c1cc3f116feb593432f590cd0` (`oferta_id`,`perfil_postulante_id`),
  KEY `FK_db4ec97f4235c8f616d9a0bd5b1` (`perfil_postulante_id`),
  CONSTRAINT `FK_daa720af7330aa5803048361675` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`),
  CONSTRAINT `FK_db4ec97f4235c8f616d9a0bd5b1` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `postulante_habilidad`;
CREATE TABLE `postulante_habilidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_postulante_id` int NOT NULL,
  `habilidad_id` int NOT NULL,
  `nivel` enum('BASICO','INTERMEDIO','AVANZADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c9d2220387897d303a35eefa64` (`perfil_postulante_id`,`habilidad_id`),
  KEY `FK_7c960afc3dd3912dc62707e3b8c` (`habilidad_id`),
  CONSTRAINT `FK_78fb7c11713535f69aa0e9d3bcb` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_7c960afc3dd3912dc62707e3b8c` FOREIGN KEY (`habilidad_id`) REFERENCES `habilidades` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `postulante_idioma`;
CREATE TABLE `postulante_idioma` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_postulante_id` int NOT NULL,
  `idioma_id` int NOT NULL,
  `nivel` enum('BASICO','INTERMEDIO','AVANZADO','NATIVO') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9f18018bdf86e11f91f5b11b00` (`perfil_postulante_id`,`idioma_id`),
  KEY `FK_876cff8702aebd617a28c09dbb4` (`idioma_id`),
  CONSTRAINT `FK_0f0673ffcb8e8238b4fd4c31905` FOREIGN KEY (`perfil_postulante_id`) REFERENCES `perfiles_postulante` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_876cff8702aebd617a28c09dbb4` FOREIGN KEY (`idioma_id`) REFERENCES `catalogos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_a5be7aa67e759e347b1c6464e1` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `suscripciones_push`;
CREATE TABLE `suscripciones_push` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `endpoint` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2a94f1283f8129f8e46a172d16` (`endpoint`),
  KEY `FK_c129ad13166bbc967a581beaf6f` (`usuario_id`),
  CONSTRAINT `FK_c129ad13166bbc967a581beaf6f` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rol_id` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo_verificado` tinyint NOT NULL DEFAULT '0',
  `activo` tinyint NOT NULL DEFAULT '1',
  `intentos_fallidos` int NOT NULL DEFAULT '0',
  `bloqueado_hasta` datetime DEFAULT NULL,
  `ultimo_acceso` datetime DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `version_token` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_446adfc18b35418aac32ae0b7b` (`email`),
  KEY `FK_9e519760a660751f4fa21453d3e` (`rol_id`),
  CONSTRAINT `FK_9e519760a660751f4fa21453d3e` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES (1,'SUPERADMIN','Administrador de la Gobernación');
INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES (2,'EMPRESA','Empresa que publica ofertas');
INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES (3,'POSTULANTE','Persona que busca empleo');

INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (1,'RUBRO','Minería',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (2,'RUBRO','Tecnología',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (3,'RUBRO','Comercio',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (4,'RUBRO','Salud',NULL,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (5,'RUBRO','Educación',NULL,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (6,'RUBRO','Construcción',NULL,6,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (7,'RUBRO','Servicios',NULL,7,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (8,'RUBRO','Transporte',NULL,8,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (9,'RUBRO','Agropecuario',NULL,9,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (10,'RUBRO','Turismo',NULL,10,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (11,'PROFESION','Ingeniería de Sistemas',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (12,'PROFESION','Ingeniería Informática',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (13,'PROFESION','Ingeniería de Software',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (14,'PROFESION','Técnico Superior en Sistemas Informáticos',NULL,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (15,'PROFESION','Ingeniería Industrial',NULL,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (16,'PROFESION','Ingeniería de Minas',NULL,6,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (17,'PROFESION','Ingeniería Metalúrgica',NULL,7,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (18,'PROFESION','Ingeniería Civil',NULL,8,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (19,'PROFESION','Ingeniería Eléctrica',NULL,9,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (20,'PROFESION','Ingeniería Electrónica',NULL,10,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (21,'PROFESION','Ingeniería Mecánica',NULL,11,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (22,'PROFESION','Electromecánica',NULL,12,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (23,'PROFESION','Mecánica Industrial',NULL,13,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (24,'PROFESION','Contaduría Pública',NULL,14,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (25,'PROFESION','Administración de Empresas',NULL,15,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (26,'PROFESION','Economía',NULL,16,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (27,'PROFESION','Derecho',NULL,17,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (28,'PROFESION','Medicina',NULL,18,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (29,'PROFESION','Enfermería',NULL,19,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (30,'PROFESION','Bioquímica',NULL,20,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (31,'PROFESION','Ciencias de la Educación',NULL,21,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (32,'PROFESION','Comunicación Social',NULL,22,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (33,'PROFESION','Arquitectura',NULL,23,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (34,'PROFESION','Agronomía',NULL,24,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (35,'PROFESION','Turismo',NULL,25,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (36,'PROFESION','Secretariado Ejecutivo',NULL,26,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (37,'TIPO_CONTRATO','Indefinido',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (38,'TIPO_CONTRATO','Plazo fijo',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (39,'TIPO_CONTRATO','Eventual',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (40,'TIPO_CONTRATO','Pasantía',NULL,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (41,'TIPO_CONTRATO','Consultoría',NULL,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (42,'MODALIDAD','Presencial',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (43,'MODALIDAD','Remoto',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (44,'MODALIDAD','Híbrido',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (45,'DEPARTAMENTO','Oruro',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (46,'DEPARTAMENTO','La Paz',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (47,'DEPARTAMENTO','Cochabamba',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (48,'DEPARTAMENTO','Santa Cruz',NULL,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (49,'DEPARTAMENTO','Potosí',NULL,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (50,'DEPARTAMENTO','Chuquisaca',NULL,6,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (51,'DEPARTAMENTO','Tarija',NULL,7,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (52,'DEPARTAMENTO','Beni',NULL,8,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (53,'DEPARTAMENTO','Pando',NULL,9,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (54,'IDIOMA','Castellano',NULL,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (55,'IDIOMA','Quechua',NULL,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (56,'IDIOMA','Aymara',NULL,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (57,'IDIOMA','Guaraní',NULL,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (58,'IDIOMA','Inglés',NULL,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (59,'IDIOMA','Portugués',NULL,6,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (60,'IDIOMA','Francés',NULL,7,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (61,'MUNICIPIO','Oruro',45,1,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (62,'MUNICIPIO','Caracollo',45,2,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (63,'MUNICIPIO','El Choro',45,3,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (64,'MUNICIPIO','Soracachi',45,4,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (65,'MUNICIPIO','Challapata',45,5,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (66,'MUNICIPIO','Santuario de Quillacas',45,6,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (67,'MUNICIPIO','Corque',45,7,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (68,'MUNICIPIO','Choquecota',45,8,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (69,'MUNICIPIO','Curahuara de Carangas',45,9,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (70,'MUNICIPIO','Turco',45,10,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (71,'MUNICIPIO','Huachacalla',45,11,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (72,'MUNICIPIO','Escara',45,12,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (73,'MUNICIPIO','Cruz de Machacamarca',45,13,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (74,'MUNICIPIO','Yunguyo de Litoral',45,14,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (75,'MUNICIPIO','Esmeralda',45,15,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (76,'MUNICIPIO','Poopó',45,16,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (77,'MUNICIPIO','Pazña',45,17,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (78,'MUNICIPIO','Antequera',45,18,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (79,'MUNICIPIO','Huanuni',45,19,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (80,'MUNICIPIO','Machacamarca',45,20,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (81,'MUNICIPIO','Salinas de Garci Mendoza',45,21,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (82,'MUNICIPIO','Pampa Aullagas',45,22,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (83,'MUNICIPIO','Sabaya',45,23,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (84,'MUNICIPIO','Coipasa',45,24,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (85,'MUNICIPIO','Chipaya',45,25,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (86,'MUNICIPIO','Toledo',45,26,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (87,'MUNICIPIO','Eucaliptus',45,27,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (88,'MUNICIPIO','Santiago de Andamarca',45,28,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (89,'MUNICIPIO','Belén de Andamarca',45,29,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (90,'MUNICIPIO','Totora',45,30,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (91,'MUNICIPIO','Santiago de Huari',45,31,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (92,'MUNICIPIO','La Rivera',45,32,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (93,'MUNICIPIO','Todos Santos',45,33,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (94,'MUNICIPIO','Carangas',45,34,1);
INSERT INTO `catalogos` (`id`, `tipo`, `nombre`, `padre_id`, `orden`, `activo`) VALUES (95,'MUNICIPIO','Huayllamarca',45,35,1);

INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (1,'Laravel','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (2,'PHP','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (3,'Python','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (4,'Java','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (5,'JavaScript','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (6,'TypeScript','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (7,'Angular','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (8,'React','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (9,'NestJS','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (10,'Node.js','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (11,'MySQL','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (12,'PostgreSQL','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (13,'Redes','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (14,'Linux','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (15,'Docker','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (16,'Git','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (17,'Soporte técnico','Tecnología',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (18,'Ofimática','Oficina',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (19,'Excel avanzado','Oficina',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (20,'Contabilidad','Administración',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (21,'Facturación electrónica','Administración',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (22,'Atención al cliente','Administración',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (23,'Gestión de proyectos','Administración',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (24,'AutoCAD','Técnica',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (25,'Soldadura','Técnica',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (26,'Mantenimiento mecánico','Técnica',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (27,'Electricidad industrial','Técnica',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (28,'Seguridad industrial','Técnica',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (29,'Trabajo en equipo','Habilidades blandas',1);
INSERT INTO `habilidades` (`id`, `nombre`, `categoria`, `activo`) VALUES (30,'Liderazgo','Habilidades blandas',1);

INSERT INTO `configuraciones` (`id`, `clave`, `valor`, `descripcion`) VALUES (1,'limite_ofertas_activas','5','Cantidad máxima de ofertas activas por empresa');

INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (1,1794109629567,'InitialSchema1794109629567');
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (2,1794144875053,'AddAttemptsToVerificationCodes1794144875053');
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (3,1794148595988,'ReplacePhoneVerificationWithEmail1794148595988');
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (4,1794152027362,'AddTokenVersionToUsers1794152027362');
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (5,1794188379405,'AddOfferSearchIndex1794188379405');

SET FOREIGN_KEY_CHECKS = 1;

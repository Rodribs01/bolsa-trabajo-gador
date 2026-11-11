# Diccionario de datos

Base de datos de la Bolsa de Trabajo Departamental Digital del Gobierno Autónomo Departamental de Oruro.

- Motor: MySQL 8 (en la demo, TiDB Cloud, compatible con MySQL).
- Juego de caracteres: `utf8mb4`.
- Tablas del modelo: 20 (más la tabla interna `migrations` de TypeORM).
- Convenciones: tablas y columnas en español y `snake_case`; clave primaria `id` autoincremental; claves foráneas `<tabla_en_singular>_id`; fechas de auditoría `creado_en` y `actualizado_en`.
- La estructura se crea con las migraciones de TypeORM (`backend/src/database/migrations`). El script `bolsa_trabajo.sql` es la misma estructura exportada, con los datos iniciales de roles, catálogos, habilidades y configuración.

Claves: **PK** clave primaria, **FK** clave foránea, **UQ** valor único.

## Equivalencia con las tablas mínimas de las bases

| Tabla de las bases | Tabla en este sistema |
|---|---|
| users | `usuarios` |
| roles | `roles` |
| postulante_profiles | `perfiles_postulante` |
| formaciones | `formaciones` |
| experiencias | `experiencias` |
| empresas | `empresas` |
| ofertas | `ofertas` |
| habilidades | `habilidades` |
| oferta_habilidad | `oferta_habilidad` |
| postulaciones | `postulaciones` |
| catalogos | `catalogos` |
| audit_logs | `auditoria` |

Tablas adicionales: `codigos_verificacion`, `postulante_habilidad`, `postulante_idioma`, `oferta_profesion`, `favoritos`, `configuraciones`, `notificaciones` y `suscripciones_push`.

## Índice

1. [roles](#roles)
2. [usuarios](#usuarios)
3. [codigos_verificacion](#codigos_verificacion)
4. [perfiles_postulante](#perfiles_postulante)
5. [formaciones](#formaciones)
6. [experiencias](#experiencias)
7. [habilidades](#habilidades)
8. [postulante_habilidad](#postulante_habilidad)
9. [postulante_idioma](#postulante_idioma)
10. [empresas](#empresas)
11. [ofertas](#ofertas)
12. [oferta_profesion](#oferta_profesion)
13. [oferta_habilidad](#oferta_habilidad)
14. [postulaciones](#postulaciones)
15. [favoritos](#favoritos)
16. [catalogos](#catalogos)
17. [configuraciones](#configuraciones)
18. [notificaciones](#notificaciones)
19. [suscripciones_push](#suscripciones_push)
20. [auditoria](#auditoria)
21. [migrations](#migrations)

## roles

Roles del sistema. Cada usuario tiene uno solo.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del rol. |
| nombre | varchar(30) | No | UQ | Nombre del rol: SUPERADMIN, EMPRESA o POSTULANTE. |
| descripcion | varchar(150) | Sí |  | Explicación breve de lo que puede hacer el rol. |

## usuarios

Cuentas de acceso al sistema (postulantes, empresas y administradores de la Gobernación).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del usuario. |
| rol_id | int | No | FK → roles.id | Rol del usuario (roles.id). |
| nombre | varchar(150) | No |  | Nombre que se muestra en el sistema. |
| email | varchar(150) | No | UQ | Correo de inicio de sesión. Único. |
| celular | varchar(20) | Sí |  | Celular de contacto. Se registra pero no se verifica. |
| password | varchar(255) | No |  | Contraseña cifrada con bcrypt (10 rondas). Nunca se devuelve en las respuestas de la API. |
| correo_verificado | tinyint | No |  | Indica si el usuario confirmó su correo con el código de 6 dígitos. |
| activo | tinyint | No |  | Permite deshabilitar una cuenta sin borrarla. |
| intentos_fallidos | int | No |  | Intentos de inicio de sesión fallidos seguidos. |
| bloqueado_hasta | datetime | Sí |  | Fecha y hora hasta la que la cuenta queda bloqueada tras 5 intentos fallidos (15 minutos). |
| ultimo_acceso | datetime | Sí |  | Fecha y hora del último inicio de sesión correcto. |
| creado_en | datetime(6) | No |  | Fecha de registro. |
| actualizado_en | datetime(6) | No |  | Fecha de la última modificación. |
| version_token | int | No |  | Se incrementa al cambiar o recuperar la contraseña para invalidar los tokens anteriores. |

## codigos_verificacion

Códigos de un solo uso para verificar el correo y para recuperar la contraseña.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del código. |
| usuario_id | int | No | FK → usuarios.id | Usuario al que pertenece el código (usuarios.id). |
| tipo | enum('OTP_CORREO','RECUPERACION') | No |  | OTP_CORREO (verificación de correo) o RECUPERACION (enlace de nueva contraseña). |
| codigo_hash | varchar(255) | No |  | Código o token guardado como hash; el valor real solo viaja por correo. |
| expira_en | datetime | No |  | Vencimiento: 10 minutos para el OTP y 30 minutos para la recuperación. |
| usado | tinyint | No |  | Indica si el código ya se usó. |
| creado_en | datetime(6) | No |  | Fecha de emisión. Se usa para limitar los reenvíos (1 minuto de espera y 3 por hora). |
| intentos | int | No |  | Intentos fallidos con este código (máximo 3). |

## perfiles_postulante

Hoja de vida del postulante: datos personales, foto, CV y porcentaje de completitud.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del perfil. |
| usuario_id | int | No | FK → usuarios.id, UQ | Cuenta del postulante (usuarios.id). |
| ci | varchar(15) | No | UQ | Cédula de identidad. Única. |
| ci_expedido | varchar(3) | No |  | Departamento de expedición del CI (por ejemplo OR, LP, CB). |
| nombres | varchar(80) | No |  | Nombres del postulante. |
| apellidos | varchar(80) | No |  | Apellidos del postulante. |
| fecha_nacimiento | date | Sí |  | Fecha de nacimiento. |
| direccion | varchar(200) | Sí |  | Dirección de domicilio. |
| municipio_id | int | Sí | FK → catalogos.id | Municipio de residencia (catalogos.id, tipo MUNICIPIO). |
| profesion_id | int | Sí | FK → catalogos.id | Profesión principal (catalogos.id, tipo PROFESION). |
| foto | varchar(255) | Sí |  | Nombre aleatorio del archivo de la foto en uploads/public/photos. |
| cv | varchar(255) | Sí |  | Nombre aleatorio del CV en PDF (máximo 5 MB). Solo se descarga por un endpoint protegido. |
| resumen | text | Sí |  | Presentación breve del postulante. |
| porcentaje_completitud | int | No |  | Porcentaje del perfil completo (0 a 100). Debe ser mayor a 80 para postular. |
| creado_en | datetime(6) | No |  | Fecha de creación del perfil. |
| actualizado_en | datetime(6) | No |  | Fecha de la última modificación. |

## formaciones

Formación académica del postulante.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Perfil al que pertenece (perfiles_postulante.id). |
| titulo | varchar(150) | No |  | Título obtenido. |
| institucion | varchar(150) | No |  | Universidad o instituto. |
| anio_titulacion | smallint | No |  | Año de titulación. |
| nro_titulo_nacional | varchar(30) | Sí |  | Número del título en provisión nacional (opcional). |

## experiencias

Experiencia laboral del postulante.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Perfil al que pertenece (perfiles_postulante.id). |
| empresa | varchar(150) | No |  | Empresa o institución donde trabajó. |
| cargo | varchar(100) | No |  | Cargo desempeñado. |
| lugar | varchar(100) | Sí |  | Ciudad o lugar de trabajo. |
| fecha_inicio | date | No |  | Fecha de inicio. |
| fecha_fin | date | Sí |  | Fecha de fin. Vacía si es su trabajo actual. |
| anios | decimal(4,1) | No |  | Años de experiencia calculados al guardar. |
| descripcion | text | Sí |  | Funciones y logros. |

## habilidades

Catálogo de habilidades técnicas y blandas que usan postulantes y ofertas.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador de la habilidad. |
| nombre | varchar(80) | No | UQ | Nombre de la habilidad. Único. |
| categoria | varchar(60) | Sí |  | Grupo al que pertenece (Tecnología, Administración, Técnica, etc.). |
| activo | tinyint | No |  | Si está inactiva no aparece en los formularios nuevos. |

## postulante_habilidad

Habilidades que declara cada postulante, con su nivel.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Perfil del postulante (perfiles_postulante.id). |
| habilidad_id | int | No | FK → habilidades.id | Habilidad (habilidades.id). |
| nivel | enum('BASICO','INTERMEDIO','AVANZADO') | No |  | BASICO, INTERMEDIO o AVANZADO. |

Índice único compuesto: (perfil_postulante_id, habilidad_id).

## postulante_idioma

Idiomas que habla cada postulante, con su nivel.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Perfil del postulante (perfiles_postulante.id). |
| idioma_id | int | No | FK → catalogos.id | Idioma (catalogos.id, tipo IDIOMA). |
| nivel | enum('BASICO','INTERMEDIO','AVANZADO','NATIVO') | No |  | BASICO, INTERMEDIO, AVANZADO o NATIVO. |

Índice único compuesto: (perfil_postulante_id, idioma_id).

## empresas

Empresas registradas y su estado de validación por la Gobernación.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador de la empresa. |
| usuario_id | int | No | FK → usuarios.id, UQ | Cuenta de la empresa (usuarios.id). |
| nit | varchar(20) | No | UQ | Número de Identificación Tributaria. Único. |
| razon_social | varchar(150) | No |  | Razón social. |
| rubro_id | int | No | FK → catalogos.id | Rubro (catalogos.id, tipo RUBRO). |
| representante_legal | varchar(150) | No |  | Nombre del representante legal. |
| ci_representante | varchar(15) | No |  | CI del representante legal. |
| celular | varchar(20) | No |  | Celular de contacto. |
| email_corporativo | varchar(150) | No |  | Correo corporativo. |
| direccion | varchar(200) | No |  | Dirección de la empresa. |
| municipio_id | int | No | FK → catalogos.id | Municipio (catalogos.id, tipo MUNICIPIO). |
| numero_trabajadores | int | Sí |  | Cantidad aproximada de trabajadores (opcional). |
| logo | varchar(255) | Sí |  | Nombre aleatorio del logo (PNG o JPG, máximo 2 MB) en uploads/public/logos. |
| documento_respaldo | varchar(255) | No |  | Nombre aleatorio del PDF de respaldo (NIT). Solo lo descarga el administrador. |
| descripcion | text | No |  | Descripción de la empresa. |
| estado | enum('PENDIENTE_VALIDACION','APROBADA','RECHAZADA','SUSPENDIDA') | No |  | PENDIENTE_VALIDACION, APROBADA, RECHAZADA o SUSPENDIDA. Solo una empresa APROBADA publica ofertas. |
| motivo_rechazo | text | Sí |  | Motivo obligatorio cuando el administrador rechaza la empresa. |
| validado_por | int | Sí | FK → usuarios.id | Administrador que aprobó, rechazó o suspendió (usuarios.id). |
| validado_en | datetime | Sí |  | Fecha de la última validación. |
| creado_en | datetime(6) | No |  | Fecha de registro. |
| actualizado_en | datetime(6) | No |  | Fecha de la última modificación. |

## ofertas

Ofertas laborales publicadas por las empresas y su flujo de estados.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador de la oferta. |
| empresa_id | int | No | FK → empresas.id | Empresa que publica (empresas.id). |
| titulo | varchar(150) | No |  | Título del puesto. |
| descripcion | text | No |  | Descripción del puesto. |
| requisitos_obligatorios | text | No |  | Requisitos indispensables. |
| requisitos_deseables | text | Sí |  | Requisitos que suman pero no son obligatorios. |
| anios_experiencia | int | No |  | Años de experiencia requeridos. |
| tipo_contrato_id | int | No | FK → catalogos.id | Tipo de contrato (catalogos.id, tipo TIPO_CONTRATO). |
| modalidad_id | int | No | FK → catalogos.id | Modalidad de trabajo (catalogos.id, tipo MODALIDAD). |
| municipio_id | int | No | FK → catalogos.id | Municipio del puesto (catalogos.id, tipo MUNICIPIO). |
| salario_min | decimal(10,2) | Sí |  | Salario mínimo en bolivianos. |
| salario_max | decimal(10,2) | Sí |  | Salario máximo en bolivianos. |
| salario_a_tratar | tinyint | No |  | Indica que el salario se acuerda en la entrevista. |
| beneficios | text | Sí |  | Lista de beneficios guardada como JSON. |
| fecha_cierre | date | No |  | Último día para postular. Al pasar, la tarea programada la lleva a EN_PROCESO_SELECCION. |
| numero_plazas | int | No |  | Cantidad de puestos disponibles. |
| estado | enum('BORRADOR','EN_REVISION_GADOR','PUBLICADA','EN_PROCESO_SELECCION','CERRADA','ANULADA') | No |  | BORRADOR, EN_REVISION_GADOR, PUBLICADA, EN_PROCESO_SELECCION, CERRADA o ANULADA. |
| observacion | text | Sí |  | Observación del administrador cuando devuelve la oferta a BORRADOR. |
| total_vistas | int | No |  | Cantidad de veces que se abrió el detalle público. |
| oferta_origen_id | int | Sí | FK → ofertas.id | Oferta de la que se duplicó, si corresponde (ofertas.id). |
| publicado_en | datetime | Sí |  | Fecha en que la Gobernación aprobó y publicó la oferta. |
| creado_en | datetime(6) | No |  | Fecha de creación. |
| actualizado_en | datetime(6) | No |  | Fecha de la última modificación. |

## oferta_profesion

Profesiones a las que se dirige cada oferta (puede tener varias).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| oferta_id | int | No | FK → ofertas.id | Oferta (ofertas.id). |
| profesion_id | int | No | FK → catalogos.id | Profesión (catalogos.id, tipo PROFESION). |

Índice único compuesto: (oferta_id, profesion_id).

## oferta_habilidad

Habilidades requeridas por cada oferta. Se usan para calcular el porcentaje de coincidencia.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| oferta_id | int | No | FK → ofertas.id | Oferta (ofertas.id). |
| habilidad_id | int | No | FK → habilidades.id | Habilidad (habilidades.id). |
| obligatoria | tinyint | No |  | Si es obligatoria pesa 2 en el cálculo; si es deseable pesa 1. |

Índice único compuesto: (oferta_id, habilidad_id).

## postulaciones

Postulaciones de los postulantes a las ofertas.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador de la postulación. |
| oferta_id | int | No | FK → ofertas.id | Oferta (ofertas.id). |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Postulante (perfiles_postulante.id). La pareja oferta y postulante es única. |
| estado | enum('POSTULADO','VISTO','PRESELECCIONADO','ENTREVISTA','FINALISTA','CONTRATADO','RECHAZADO','RETIRADO') | No |  | POSTULADO, VISTO, PRESELECCIONADO, ENTREVISTA, FINALISTA, CONTRATADO, RECHAZADO o RETIRADO. |
| porcentaje_match | int | No |  | Coincidencia de habilidades calculada al postular (0 a 100). |
| visto_en | datetime | Sí |  | Fecha en que la empresa abrió el perfil por primera vez. |
| creado_en | datetime(6) | No |  | Fecha de la postulación. |
| actualizado_en | datetime(6) | No |  | Fecha del último cambio de estado. |

Índice único compuesto: (oferta_id, perfil_postulante_id).

## favoritos

Ofertas guardadas por cada postulante.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| perfil_postulante_id | int | No | FK → perfiles_postulante.id | Postulante (perfiles_postulante.id). |
| oferta_id | int | No | FK → ofertas.id | Oferta guardada (ofertas.id). |
| creado_en | datetime(6) | No |  | Fecha en que se guardó. |

Índice único compuesto: (perfil_postulante_id, oferta_id).

## catalogos

Catálogos generales: rubros, profesiones, tipos de contrato, modalidades, departamentos, municipios e idiomas.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del registro. |
| tipo | enum('RUBRO','PROFESION','TIPO_CONTRATO','MODALIDAD','DEPARTAMENTO','MUNICIPIO','IDIOMA') | No |  | RUBRO, PROFESION, TIPO_CONTRATO, MODALIDAD, DEPARTAMENTO, MUNICIPIO o IDIOMA. |
| nombre | varchar(100) | No |  | Nombre que se muestra. |
| padre_id | int | Sí | FK → catalogos.id | Registro padre: el departamento de cada municipio (catalogos.id). |
| orden | int | No |  | Orden en las listas. |
| activo | tinyint | No |  | Si está inactivo no aparece en los formularios nuevos; los datos existentes se conservan. |

## configuraciones

Parámetros del sistema que el administrador puede cambiar sin tocar el código.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del parámetro. |
| clave | varchar(60) | No | UQ | Nombre del parámetro. Único. Ejemplo: limite_ofertas_activas. |
| valor | varchar(255) | No |  | Valor guardado como texto. |
| descripcion | varchar(200) | Sí |  | Explicación del parámetro. |

Parámetro actual: `limite_ofertas_activas` (por defecto 5), máximo de ofertas por empresa en `EN_REVISION_GADOR`, `PUBLICADA` o `EN_PROCESO_SELECCION`. Se cambia desde Administración → Configuración.

## notificaciones

Avisos internos que ve cada usuario en la campana del sistema.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del aviso. |
| usuario_id | int | No | FK → usuarios.id | Destinatario (usuarios.id). |
| tipo | enum('CV_VISTO','CAMBIO_ESTADO_POSTULACION','EMPRESA_VALIDADA','OFERTA_POR_VENCER','NUEVA_OFERTA') | No |  | CV_VISTO, CAMBIO_ESTADO_POSTULACION, EMPRESA_VALIDADA, OFERTA_POR_VENCER o NUEVA_OFERTA. |
| titulo | varchar(150) | No |  | Título del aviso. |
| mensaje | varchar(500) | No |  | Texto del aviso (máximo 500 caracteres). |
| enlace | varchar(255) | Sí |  | Ruta interna a la que lleva el aviso. |
| leida | tinyint | No |  | Indica si el usuario ya lo leyó. |
| creado_en | datetime(6) | No |  | Fecha del aviso. |

## suscripciones_push

Dispositivos que activaron los avisos push de la PWA (máximo 10 por usuario).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador de la suscripción. |
| usuario_id | int | No | FK → usuarios.id | Usuario dueño del dispositivo (usuarios.id). |
| endpoint | varchar(500) | No | UQ | Dirección del servicio push del navegador. Única. |
| p256dh | varchar(255) | No |  | Clave pública del dispositivo para cifrar los avisos. |
| auth | varchar(255) | No |  | Secreto de autenticación del dispositivo para cifrar los avisos. |
| creado_en | datetime(6) | No |  | Fecha de activación. |

## auditoria

Registro de acciones importantes: inicios de sesión, validaciones, cambios de estado y cambios de datos.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador del evento. |
| usuario_id | int | Sí | FK → usuarios.id | Usuario que hizo la acción (usuarios.id). Vacío si la hizo una tarea programada o si el usuario fue eliminado. |
| accion | enum('CREATE','UPDATE','DELETE','LOGIN','CHANGE_STATUS') | No |  | CREATE, UPDATE, DELETE, LOGIN o CHANGE_STATUS. |
| tabla | varchar(60) | No |  | Tabla afectada. |
| registro_id | int | Sí |  | Identificador del registro afectado. |
| datos_anteriores | json | Sí |  | Datos antes del cambio (JSON). |
| datos_nuevos | json | Sí |  | Datos después del cambio (JSON). |
| ip | varchar(45) | Sí |  | Dirección IP desde la que se hizo la acción. |
| creado_en | datetime(6) | No |  | Fecha y hora del evento. |

## migrations

Tabla interna de TypeORM con las migraciones ya aplicadas. No se modifica a mano.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| id | int | No | PK | Identificador. |
| timestamp | bigint | No |  | Marca de tiempo de la migración. |
| name | varchar(255) | No |  | Nombre de la migración. |

## Relaciones y eliminación en cascada

| Tabla | Columna | Referencia | Al borrar el registro referido |
|---|---|---|---|
| usuarios | rol_id | roles.id | No se permite borrar |
| codigos_verificacion | usuario_id | usuarios.id | Se borra también |
| perfiles_postulante | municipio_id | catalogos.id | No se permite borrar |
| perfiles_postulante | profesion_id | catalogos.id | No se permite borrar |
| perfiles_postulante | usuario_id | usuarios.id | No se permite borrar |
| formaciones | perfil_postulante_id | perfiles_postulante.id | Se borra también |
| experiencias | perfil_postulante_id | perfiles_postulante.id | Se borra también |
| postulante_habilidad | habilidad_id | habilidades.id | No se permite borrar |
| postulante_habilidad | perfil_postulante_id | perfiles_postulante.id | Se borra también |
| postulante_idioma | idioma_id | catalogos.id | No se permite borrar |
| postulante_idioma | perfil_postulante_id | perfiles_postulante.id | Se borra también |
| empresas | municipio_id | catalogos.id | No se permite borrar |
| empresas | rubro_id | catalogos.id | No se permite borrar |
| empresas | usuario_id | usuarios.id | No se permite borrar |
| empresas | validado_por | usuarios.id | No se permite borrar |
| ofertas | empresa_id | empresas.id | No se permite borrar |
| ofertas | modalidad_id | catalogos.id | No se permite borrar |
| ofertas | municipio_id | catalogos.id | No se permite borrar |
| ofertas | oferta_origen_id | ofertas.id | No se permite borrar |
| ofertas | tipo_contrato_id | catalogos.id | No se permite borrar |
| oferta_profesion | oferta_id | ofertas.id | Se borra también |
| oferta_profesion | profesion_id | catalogos.id | No se permite borrar |
| oferta_habilidad | habilidad_id | habilidades.id | No se permite borrar |
| oferta_habilidad | oferta_id | ofertas.id | Se borra también |
| postulaciones | oferta_id | ofertas.id | No se permite borrar |
| postulaciones | perfil_postulante_id | perfiles_postulante.id | No se permite borrar |
| favoritos | oferta_id | ofertas.id | Se borra también |
| favoritos | perfil_postulante_id | perfiles_postulante.id | Se borra también |
| catalogos | padre_id | catalogos.id | No se permite borrar |
| notificaciones | usuario_id | usuarios.id | Se borra también |
| suscripciones_push | usuario_id | usuarios.id | Se borra también |
| auditoria | usuario_id | usuarios.id | No se permite borrar |

## Valores de estados y listas

Los valores se guardan en MAYÚSCULAS y sin tildes.

### roles.nombre

| Valor | Significado |
|---|---|
| SUPERADMIN | Administrador de la Gobernación |
| EMPRESA | Empresa empleadora |
| POSTULANTE | Persona que busca empleo |

### empresas.estado

| Valor | Significado |
|---|---|
| PENDIENTE_VALIDACION | Registrada, espera la revisión de la Gobernación |
| APROBADA | Validada: puede publicar ofertas |
| RECHAZADA | Rechazada con motivo obligatorio |
| SUSPENDIDA | Suspendida: no crea, edita ni envía ofertas; puede cerrar o anular las suyas |

### ofertas.estado

| Valor | Significado |
|---|---|
| BORRADOR | En edición por la empresa |
| EN_REVISION_GADOR | Enviada a revisión de la Gobernación |
| PUBLICADA | Visible y recibe postulaciones |
| EN_PROCESO_SELECCION | Pasó la fecha de cierre: la empresa evalúa postulantes |
| CERRADA | Cerrada por la empresa |
| ANULADA | Anulada por la empresa |

### postulaciones.estado

| Valor | Significado |
|---|---|
| POSTULADO | Postulación enviada |
| VISTO | La empresa abrió el perfil |
| PRESELECCIONADO | Pasó el primer filtro |
| ENTREVISTA | Citado a entrevista |
| FINALISTA | Entre los últimos candidatos |
| CONTRATADO | Contratado |
| RECHAZADO | No continúa en el proceso |
| RETIRADO | El postulante retiró su postulación (solo desde POSTULADO) |

### catalogos.tipo

| Valor | Significado |
|---|---|
| RUBRO | Rubro de las empresas |
| PROFESION | Profesiones |
| TIPO_CONTRATO | Tipos de contrato |
| MODALIDAD | Presencial, remoto o híbrido |
| DEPARTAMENTO | Departamentos de Bolivia |
| MUNICIPIO | Municipios (hijos de un departamento) |
| IDIOMA | Idiomas |

### postulante_habilidad.nivel

| Valor | Significado |
|---|---|
| BASICO | Básico |
| INTERMEDIO | Intermedio |
| AVANZADO | Avanzado |

### postulante_idioma.nivel

| Valor | Significado |
|---|---|
| BASICO | Básico |
| INTERMEDIO | Intermedio |
| AVANZADO | Avanzado |
| NATIVO | Nativo |

### codigos_verificacion.tipo

| Valor | Significado |
|---|---|
| OTP_CORREO | Código de 6 dígitos para verificar el correo |
| RECUPERACION | Enlace de un solo uso para restablecer la contraseña |

### notificaciones.tipo

| Valor | Significado |
|---|---|
| CV_VISTO | La empresa vio el perfil |
| CAMBIO_ESTADO_POSTULACION | Cambió el estado de una postulación |
| EMPRESA_VALIDADA | La Gobernación aprobó, rechazó o suspendió la empresa |
| OFERTA_POR_VENCER | Una oferta guardada cierra mañana |
| NUEVA_OFERTA | Se publicó una oferta de la profesión del postulante |

### auditoria.accion

| Valor | Significado |
|---|---|
| CREATE | Alta de un registro |
| UPDATE | Modificación |
| DELETE | Eliminación |
| LOGIN | Inicio de sesión |
| CHANGE_STATUS | Cambio de estado (empresas, ofertas, postulaciones) |

Flujo de una oferta: `BORRADOR → EN_REVISION_GADOR → PUBLICADA → EN_PROCESO_SELECCION → CERRADA` (la empresa también puede anularla). La Gobernación puede devolverla de `EN_REVISION_GADOR` a `BORRADOR` con una observación.

Flujo de una postulación: `POSTULADO → VISTO → PRESELECCIONADO → ENTREVISTA → FINALISTA → CONTRATADO`, o `RECHAZADO` desde cualquier etapa entre `VISTO` y `FINALISTA`. El postulante puede pasarla a `RETIRADO` solo mientras está en `POSTULADO`.

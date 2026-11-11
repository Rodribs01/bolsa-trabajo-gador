# Manual técnico

Bolsa de Trabajo Departamental Digital del Gobierno Autónomo Departamental de Oruro (G.A.D.OR.).

Este documento explica cómo está construido el sistema, cómo se instala, cómo se configura y cómo se despliega. Está dirigido al personal técnico de la Unidad de Sistemas e Informática.

## Contenido

1. [Descripción general](#1-descripción-general)
2. [Arquitectura](#2-arquitectura)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Módulos del backend y API](#4-módulos-del-backend-y-api)
5. [Seguridad aplicada](#5-seguridad-aplicada)
6. [Instalación local](#6-instalación-local)
7. [Configuración (variables de entorno)](#7-configuración-variables-de-entorno)
8. [Despliegue](#8-despliegue)
9. [Tareas programadas](#9-tareas-programadas)
10. [Reglas de negocio y cálculos](#10-reglas-de-negocio-y-cálculos)
11. [Notificaciones](#11-notificaciones)
12. [Reportes y dashboard](#12-reportes-y-dashboard)
13. [Escalabilidad](#13-escalabilidad)
14. [Decisiones respecto a las bases del concurso](#14-decisiones-respecto-a-las-bases-del-concurso)
15. [Mantenimiento](#15-mantenimiento)

## 1. Descripción general

El sistema conecta a la población del departamento de Oruro con empresas validadas por la Gobernación. Tiene tres roles:

| Rol | Valor en la base | Qué hace |
|---|---|---|
| Postulante | `POSTULANTE` | Registra su hoja de vida, busca ofertas, guarda favoritas y postula. |
| Empresa | `EMPRESA` | Se registra, espera la validación de la Gobernación, publica ofertas y gestiona a sus postulantes. |
| Administrador | `SUPERADMIN` | Valida empresas y ofertas, administra catálogos y configuración, consulta el dashboard, los reportes y la auditoría. |

Se usa como sitio web y también como aplicación instalable en el celular (PWA).

## 2. Arquitectura

El sistema sigue el patrón **MVC** separado en dos aplicaciones que se comunican por una API REST con JSON:

| Capa MVC | Dónde está | Tecnología |
|---|---|---|
| Modelo | Entidades de TypeORM (`backend/src/**/entities`) y la base de datos MySQL | TypeORM 1.x, MySQL 8 |
| Controlador | Controladores y servicios de NestJS (`backend/src/**/*.controller.ts` y `*.service.ts`) | NestJS 12, TypeScript |
| Vista | Aplicación Angular (`frontend/src/app`) | Angular 22, Bootstrap 5.3 |

Flujo de una petición:

```
Navegador (Angular)  ->  Controlador (recibe y valida con DTO)  ->  Servicio (reglas de negocio)
                                                                     ->  Repositorio TypeORM  ->  MySQL
```

- El **controlador** solo recibe la petición, valida los datos con un DTO y llama al servicio.
- El **servicio** contiene las reglas de negocio (estados, permisos sobre los registros, cálculos, auditoría).
- La **entidad** describe la tabla. Las clases están en inglés y las tablas y columnas en español, por ejemplo `@Entity('empresas') class Company`.

Tecnologías principales:

| Parte | Tecnología |
|---|---|
| Backend | NestJS, TypeScript, TypeORM con migraciones, `class-validator` |
| Autenticación | JWT (`@nestjs/jwt`, `passport-jwt`) y `bcryptjs` |
| Seguridad | `helmet`, `@nestjs/throttler`, CORS restringido |
| Correo | API web de Brevo (o consola en desarrollo) |
| Avisos push | `web-push` con claves VAPID |
| Tareas programadas | `@nestjs/schedule` |
| Reportes | `exceljs` (Excel) y `pdfmake` (PDF) |
| Documentación de la API | Swagger en `/api/docs` |
| Frontend | Angular con componentes standalone, Bootstrap 5.3, Bootstrap Icons |
| Gráficos | `chart.js` con `ng2-charts` |
| PWA | `@angular/service-worker` (manifest, service worker, avisos push) |
| Base de datos | MySQL 8 en Docker (local) y TiDB Cloud, compatible con MySQL (demo) |

## 3. Estructura de carpetas

```
bolsa-trabajo-gador/
├── backend/
│   ├── assets/                 # escudo de la Gobernación para el membrete de los reportes
│   ├── src/
│   │   ├── auth/               # registro, verificación de correo, inicio de sesión, contraseñas, JWT
│   │   ├── users/              # entidades de usuario y rol
│   │   ├── applicants/         # perfil del postulante, formación, experiencia, habilidades, idiomas, foto y CV
│   │   ├── companies/          # registro y validación de empresas
│   │   ├── job-offers/         # ofertas, estados, búsqueda pública y favoritos
│   │   ├── applications/       # postulaciones, % de coincidencia, gestión por la empresa
│   │   ├── catalogs/           # catálogos públicos, administración de catálogos y configuración
│   │   ├── notifications/      # avisos internos, correo, push y tareas programadas
│   │   ├── dashboard/          # indicadores del administrador
│   │   ├── reports/            # reportes en Excel y PDF
│   │   ├── audit/              # registro y consulta de auditoría
│   │   ├── common/             # guards, decorador de roles, enums, DTO de paginación, almacenamiento de archivos
│   │   ├── database/           # data-source, migraciones y seeders
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── uploads/                # archivos subidos (no se versiona)
├── frontend/
│   └── src/app/
│       ├── core/               # servicios, interceptor, guards, modelos y utilidades
│       ├── shared/             # barra de navegación, pie de página y componentes reutilizables
│       └── pages/
│           ├── public/         # inicio, ofertas, detalle, ingreso, registros, recuperación
│           ├── applicant/      # panel, perfil, postulaciones, favoritos
│           ├── company/        # panel, ofertas, postulantes
│           ├── admin/          # dashboard, empresas, ofertas, reportes, catálogos, configuración, auditoría
│           └── account/        # notificaciones y cambio de contraseña (todos los roles)
├── database/                   # script SQL, diagrama entidad relación y diccionario de datos
├── docs/                       # manual técnico y manual de usuario
├── docker-compose.yml          # MySQL 8 para desarrollo
├── netlify.toml                # despliegue del frontend
├── .env.example                # variables de entorno sin valores
└── README.md
```

Cada módulo del backend tiene la misma forma: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/` y `dto/`.

## 4. Módulos del backend y API

Todas las rutas empiezan con `/api`. La documentación interactiva de cada endpoint está en **`/api/docs`** (Swagger). Para probar rutas protegidas se pulsa **Authorize** y se pega el token obtenido en `POST /api/auth/login`.

| Módulo | Rutas principales | Acceso |
|---|---|---|
| Autenticación | `POST /auth/register/applicant`, `POST /auth/verify-otp`, `POST /auth/resend-otp`, `PATCH /auth/change-email`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `PATCH /auth/change-password`, `GET /auth/me` | Público, salvo las dos últimas |
| Empresas | `POST /auth/register/company` | Público |
| Catálogos | `GET /catalogs?type=...`, `GET /skills` | Público |
| Ofertas públicas | `GET /job-offers` (filtros y paginación), `GET /job-offers/:id` | Público |
| Postulante | `GET/PUT /applicants/me`, foto, CV, formación, experiencia, habilidades e idiomas | `POSTULANTE` |
| Favoritos | `GET /favorites`, `POST/DELETE /favorites/:offerId` | `POSTULANTE` |
| Postulaciones | `POST /applications/:offerId`, `GET /applications/me`, `PATCH /applications/:id/withdraw` | `POSTULANTE` |
| Ofertas de la empresa | `GET/POST /company/job-offers`, `PUT /:id`, `PATCH /:id/submit`, `/close`, `/cancel`, `POST /:id/duplicate` | `EMPRESA` |
| Postulantes por oferta | `GET /company/job-offers/:id/applications`, `GET /company/applications/:id`, `PATCH /company/applications/:id/status`, `GET /company/applications/:id/cv` | `EMPRESA` |
| Validación | `GET /admin/companies`, `PATCH /admin/companies/:id/approve`, `/reject`, `/suspend`, `GET /admin/job-offers/pending`, `PATCH /admin/job-offers/:id/approve`, `/return` | `SUPERADMIN` |
| Administración | `GET /admin/dashboard`, `GET /admin/reports/:type`, `/admin/catalogs`, `/admin/skills`, `GET/PUT /admin/settings`, `GET /admin/audit` | `SUPERADMIN` |
| Notificaciones | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `GET /notifications/push-key`, `POST/DELETE /notifications/push-subscription` | Cualquier usuario con sesión |

## 5. Seguridad aplicada

### Contraseñas

- Se guardan con **bcrypt de 10 rondas** usando la librería `bcryptjs` (implementación en JavaScript del mismo algoritmo; no necesita compilar código nativo en Windows ni en el hosting).
- La columna `password` tiene `select: false` en la entidad: nunca se devuelve en las respuestas.
- Regla de contraseña segura: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.

### Autenticación con JWT

- Al iniciar sesión el backend entrega un token JWT firmado con `JWT_SECRET` que dura `JWT_EXPIRES_IN` (8 horas por defecto).
- El frontend lo guarda y lo envía en la cabecera `Authorization: Bearer <token>` mediante un interceptor.
- Cada token lleva la `version_token` del usuario. Al cambiar o recuperar la contraseña la versión aumenta y los tokens anteriores dejan de servir.
- Una respuesta 401 cierra la sesión en el navegador.

### Bloqueo y verificación

- Tras **5 intentos fallidos** de inicio de sesión la cuenta se bloquea **15 minutos** (`intentos_fallidos`, `bloqueado_hasta`).
- El correo se verifica con un **código de 6 dígitos** que vence en **10 minutos**, se guarda como hash, admite **3 intentos**, exige **1 minuto** entre reenvíos y permite **3 reenvíos por hora**.
- La recuperación de contraseña envía un **enlace de un solo uso** que vence en **30 minutos**.

### Control de acceso por rol y por registro

- Cada controlador protegido usa `JwtAuthGuard` y `RolesGuard` con el decorador `@Roles(...)`.
- Además del rol, los servicios comprueban la **propiedad del registro**: una empresa solo ve y modifica sus ofertas y sus postulantes; un postulante solo su perfil, sus postulaciones y sus favoritos; las notificaciones y suscripciones push se filtran por el usuario de la sesión.
- En el frontend, un guard por rol impide entrar a pantallas ajenas (la seguridad real está en el backend).

### Validación en el backend

- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`: cada entrada tiene un DTO con `class-validator` y cualquier campo no declarado se rechaza con 400.
- Mensajes de error en español.

### CSRF

El token JWT viaja en la cabecera `Authorization` y no en cookies. Un sitio externo no puede hacer que el navegador envíe esa cabecera por su cuenta, así que no hay sesión que pueda reutilizar: por diseño el sistema no es vulnerable a CSRF y no necesita un token CSRF adicional. CORS solo permite el origen configurado en `FRONTEND_URL`.

### XSS

- Angular escapa por defecto todo lo que se muestra con `{{ }}`. El código no usa `innerHTML` con datos de usuarios.
- Los correos HTML escapan los textos (nombres, títulos, razones sociales) antes de armarse.
- `helmet` agrega cabeceras de seguridad (Content-Security-Policy, X-Content-Type-Options, etc.).

### Límite de peticiones (throttler)

Límite general: 100 peticiones por minuto por IP. Límites propios:

| Acción | Límite |
|---|---|
| Registro de postulante o de empresa | 10 por hora por IP |
| Inicio de sesión | 10 por minuto |
| Verificar código | 5 por minuto |
| Reenviar código / olvidé mi contraseña | 3 por minuto |
| Cambiar correo, restablecer o cambiar contraseña | 5 por minuto |
| Subir foto o CV, crear o duplicar ofertas | 20 por minuto |
| Descargar reportes | 10 por minuto |

`trust proxy` está activo para que, detrás del proxy del hosting, cada visitante se cuente con su propia IP.

### Archivos subidos

- Se valida el **tipo MIME** y también los **primeros bytes** del archivo (firma real de PDF, PNG o JPG).
- Tamaños máximos: CV 5 MB (PDF), documento de respaldo 5 MB (PDF), foto 2 MB y logo 2 MB (PNG o JPG).
- Se guardan con un **nombre aleatorio** (UUID) y nunca se ejecutan.
- Carpetas: `uploads/public` (fotos y logos, se sirven directamente) y `uploads/private` (CV y documentos de respaldo, solo por endpoints protegidos que comprueban el permiso).

### Base de datos

- Todas las consultas pasan por TypeORM con parámetros; no hay SQL armado concatenando texto.
- En las búsquedas con `LIKE` se escapan los comodines `%` y `_`.
- `synchronize` está desactivado: la estructura solo cambia con migraciones.

### Otros controles

- **Auditoría** de inicios de sesión, validaciones de empresas, cambios de estado de ofertas y postulaciones, y altas o cambios de catálogos y configuración.
- **Avisos push:** solo se aceptan direcciones de los servicios push de los navegadores (Google, Mozilla, Microsoft y Apple), sin puerto ni usuario, para que nadie use el servidor para enviar datos a otro sitio. La clave privada VAPID nunca sale del servidor.
- **Reportes PDF:** la librería solo puede leer sus fuentes estándar; no lee otros archivos del disco ni descarga direcciones externas.
- **Credenciales:** todas en `.env`, que no se sube al repositorio. `.env.example` tiene solo los nombres de las variables.

## 6. Instalación local

### Requisitos

- Node.js 22 LTS o superior y npm.
- Docker Desktop (para MySQL 8).
- Git.
- Opcional: Angular CLI (`npm i -g @angular/cli`) y MySQL Workbench o DBeaver.

### Pasos

1. Clonar el repositorio:
   ```
   git clone https://github.com/Rodribs01/bolsa-trabajo-gador.git
   cd bolsa-trabajo-gador
   ```
2. Crear el archivo de configuración a partir del ejemplo y completar los valores (ver sección 7):
   ```
   copy .env.example .env      (en cmd o PowerShell)
   cp .env.example .env        (en Git Bash, Linux o macOS)
   ```
3. Levantar MySQL con Docker:
   ```
   docker compose up -d
   ```
4. Instalar el backend, crear las tablas y cargar los datos iniciales:
   ```
   cd backend
   npm install
   npm run migration:run
   npm run seed
   ```
   `npm run seed` crea los roles, los catálogos, las habilidades, la configuración y el usuario administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
5. Opcional: cargar datos de demostración (empresas, ofertas, postulantes y postulaciones de ejemplo):
   ```
   npm run seed:demo
   npm run demo-files
   ```
6. Iniciar el backend:
   ```
   npm run start:dev
   ```
   La API queda en `http://localhost:3000/api` y Swagger en `http://localhost:3000/api/docs`.
7. En otra terminal, instalar e iniciar el frontend:
   ```
   cd frontend
   npm install
   npx ng serve
   ```
   El sistema queda en `http://localhost:4200`.

En desarrollo `MAIL_DRIVER=consola` muestra los códigos y enlaces de correo en la terminal del backend, sin necesidad de una cuenta de correo.

### Script SQL alternativo

`database/bolsa_trabajo.sql` contiene la estructura completa y los datos iniciales. Se puede cargar con `mysql -u root -p < database/bolsa_trabajo.sql`. Después hay que ejecutar `npm run seed` para crear el administrador (los seeders no duplican lo que ya existe).

## 7. Configuración (variables de entorno)

Hay un único archivo `.env` en la raíz del repositorio. Lo usan `docker compose` y el backend. **Nunca se sube al repositorio.**

| Variable | Uso | Ejemplo |
|---|---|---|
| `NODE_ENV` | `development` o `production` | `development` |
| `PORT` | Puerto del backend | `3000` |
| `FRONTEND_URL` | Origen permitido por CORS y base de los enlaces en los correos | `http://localhost:4200` |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Conexión a MySQL | `localhost`, `3306`, `bolsa_trabajo` |
| `DB_USER`, `DB_PASSWORD` | Usuario de la aplicación en MySQL | |
| `DB_ROOT_PASSWORD` | Contraseña de root del contenedor Docker | |
| `DB_SSL` | `true` para bases administradas que exigen TLS (TiDB Cloud) | `false` |
| `DB_SSL_CA` | Certificado propio del proveedor, solo si lo exige | vacío |
| `JWT_SECRET` | Clave para firmar los tokens. Texto largo y aleatorio | |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador que crea el seeder | |
| `DEMO_PASSWORD` | Contraseña de los usuarios de demostración | |
| `MAIL_DRIVER` | `consola` (desarrollo) o `brevo` (envío real) | `consola` |
| `BREVO_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME` | Envío de correos por la API de Brevo. `MAIL_FROM` debe estar verificado en Brevo | |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Claves de los avisos push. `VAPID_SUBJECT` con el formato `mailto:correo` | |
| `UPLOADS_DIR` | Carpeta de archivos subidos | `uploads` |

- Las claves VAPID se crean una sola vez con `npx web-push generate-vapid-keys` (dentro de `backend`). Si se cambian, los usuarios deben volver a activar los avisos.
- Si faltan las claves VAPID, el sistema funciona igual, solo sin avisos push.
- Si `MAIL_DRIVER=brevo` y falta la configuración de correo, el backend no arranca y lo indica. Con `NODE_ENV=production` el backend exige `MAIL_DRIVER=brevo`.
- El frontend no usa `.env`: `frontend/src/environments/environment*.ts` solo tiene valores públicos (URL de la API y de los archivos).

## 8. Despliegue

La demo usa planes gratuitos:

| Parte | Servicio | Notas |
|---|---|---|
| Frontend | Netlify | HTTPS incluido (necesario para la PWA). Configuración en `netlify.toml`. |
| Backend | Render (Web Service gratuito) | Se duerme tras 15 minutos sin visitas; la primera carga puede tardar cerca de un minuto. |
| Base de datos | TiDB Cloud Starter | Compatible con MySQL; conexión con TLS (`DB_SSL=true`). |
| Correo | Brevo (plan gratuito) | Hasta 300 correos por día. Se usa su API web porque Render gratuito bloquea los puertos SMTP. |

### Base de datos (TiDB Cloud)

1. Crear un clúster Starter y una base `bolsa_trabajo`.
2. Copiar host, puerto (4000), usuario y contraseña para las variables de Render.

### Backend (Render)

1. Nuevo **Web Service** conectado al repositorio, rama `main`.
2. Root Directory: `backend`.
3. Build Command: `npm ci --include=dev && npm run build`.
4. Start Command: `npm run start:render` (aplica las migraciones pendientes, carga los datos iniciales que falten, carga los datos de demostración si `DEMO_PASSWORD` está definida, copia sus archivos a `uploads/` e inicia el servidor).
5. Variables de entorno: todas las de la sección 7 con `NODE_ENV=production`, `FRONTEND_URL` con la dirección de Netlify, los datos de TiDB, `DB_SSL=true` y `MAIL_DRIVER=brevo`. `DEMO_PASSWORD` solo se define en la demo del concurso; en una instalación real se deja sin definir y la base empieza vacía.

### Frontend (Netlify)

1. Nuevo sitio conectado al repositorio. `netlify.toml` ya define la carpeta base `frontend`, el comando de compilación, la carpeta publicada `dist/frontend/browser` y la redirección de todas las rutas a `index.html`.
2. `frontend/src/environments/environment.ts` tiene la URL del backend en Render.

### Consideraciones del plan gratuito

- **Servidor dormido:** mientras Render duerme no corre ninguna tarea programada; por eso las tareas también se ejecutan cada vez que el servidor despierta (sección 9).
- **Disco efímero:** los archivos de `uploads/` pueden perderse al reiniciar el servicio. Los datos de la base no se pierden. Para producción se recomienda un almacenamiento de objetos (por ejemplo un bucket compatible con S3) o un disco persistente.
- **Correos:** pueden llegar a la carpeta de spam o promociones mientras el dominio del remitente no tenga reputación.

## 9. Tareas programadas

Están en `backend/src/notifications/scheduled-tasks.service.ts`. Se ejecutan **cada hora** y **al iniciar el servidor**. Están hechas para que repetirlas no cause problemas.

| Tarea | Qué hace |
|---|---|
| Cierre de ofertas | Las ofertas `PUBLICADA` cuya fecha de cierre ya pasó (hora de Bolivia) pasan a `EN_PROCESO_SELECCION`. Queda en auditoría con usuario vacío y el motivo "Fecha de cierre vencida". |
| Favoritos por vencer | Avisa al postulante que guardó una oferta que cierra al día siguiente. Una sola vez por oferta y solo si aún no postuló. |
| Limpieza de cuentas | Borra postulantes que no verificaron su correo en 7 días, para que no ocupen un CI o un correo ajeno. Lo hace en una transacción y conserva su auditoría sin el usuario. |

Cada tarea tiene su propio manejo de errores: si una falla, las demás continúan. En la limpieza de cuentas, además, un error con una cuenta no detiene a las demás.

## 10. Reglas de negocio y cálculos

### Porcentaje de completitud del perfil

Se recalcula cada vez que el postulante cambia su perfil:

| Sección | Peso |
|---|---|
| Datos personales completos | 20 |
| Foto | 10 |
| Al menos una formación | 20 |
| Al menos una experiencia | 15 |
| Al menos una habilidad | 15 |
| Al menos un idioma | 5 |
| CV en PDF | 15 |
| **Total** | **100** |

### Porcentaje de coincidencia (match)

```
match = (suma de pesos de las habilidades de la oferta que el postulante tiene)
        / (suma de pesos de todas las habilidades de la oferta) x 100
```

Una habilidad obligatoria pesa 2 y una deseable pesa 1. Se calcula al postular y se guarda en `postulaciones.porcentaje_match`. La empresa ve a sus postulantes ordenados de mayor a menor coincidencia.

Ejemplo: la oferta pide Angular (obligatoria), MySQL (obligatoria) y Docker (deseable); total = 2 + 2 + 1 = 5. Un postulante con Angular y Docker suma 2 + 1 = 3, es decir 60 %.

### Requisitos para postular

1. Perfil con **más de 80 %** (80 exacto no alcanza, como dicen las bases). El porcentaje se recalcula en ese momento.
2. **CV cargado** (sin CV un perfil puede llegar a 85 %).
3. No haber postulado antes a la misma oferta (índice único en la base).
4. Oferta `PUBLICADA`, con fecha de cierre vigente y de una empresa que sigue `APROBADA`.

### Estados

- Empresa: `PENDIENTE_VALIDACION → APROBADA / RECHAZADA (con motivo obligatorio)`, y `APROBADA ↔ SUSPENDIDA`. Solo una empresa aprobada crea, edita y envía ofertas. Una suspendida puede cerrar o anular las suyas.
- Oferta: `BORRADOR → EN_REVISION_GADOR → PUBLICADA → EN_PROCESO_SELECCION → CERRADA`, o `ANULADA`. Solo se edita en `BORRADOR`. La Gobernación aprueba o devuelve a `BORRADOR` con una observación. "Duplicar" crea una copia en `BORRADOR`.
- Postulación: `POSTULADO → VISTO → PRESELECCIONADO → ENTREVISTA → FINALISTA → CONTRATADO`, o `RECHAZADO` desde cualquier etapa entre `VISTO` y `FINALISTA`. Pasa a `VISTO` automáticamente cuando la empresa abre el perfil por primera vez. El postulante puede retirarla (`RETIRADO`) solo mientras está en `POSTULADO`.

### Límite de ofertas activas

Cada empresa puede tener como máximo `limite_ofertas_activas` ofertas activas (5 por defecto, configurable entre 1 y 50 desde Administración → Configuración). Cuentan como activas las ofertas en revisión, publicadas y en proceso de selección. Al bajar el límite no se cierra ninguna oferta existente: solo se impide enviar nuevas a revisión.

## 11. Notificaciones

Cada evento crea un **aviso interno** (campana del sistema), envía un **correo** y, si el usuario los activó, un **aviso push** a sus dispositivos.

| Evento | Destinatario |
|---|---|
| La empresa abrió el perfil del postulante | Postulante |
| Cambió el estado de una postulación | Postulante |
| La Gobernación aprobó, rechazó o suspendió la empresa | Empresa |
| Una oferta guardada cierra mañana | Postulante |
| Se publicó una oferta de la profesión del postulante | Postulantes de esa profesión |

- Si el aviso falla, la acción que lo originó no se deshace.
- **Avisos push:** se activan desde la pantalla de Notificaciones ("Avisos en este dispositivo"). Viajan cifrados de extremo a extremo y firmados con las claves VAPID. Cada usuario puede tener hasta 10 dispositivos. Cuando la aplicación detecta que la sesión terminó (cierre manual, token vencido o cambio de contraseña), anula la suscripción de ese dispositivo. En iPhone solo funcionan con la aplicación instalada en la pantalla de inicio (iOS 16.4 o superior).
- WhatsApp no se implementó.

## 12. Reportes y dashboard

### Dashboard del administrador

Los indicadores **se calculan en cada carga** con consultas a la base; no se guardan en tablas aparte, así siempre están al día.

| Indicador | Cómo se calcula |
|---|---|
| Postulantes registrados | Perfiles con correo verificado (y cuántos se registraron en el mes) |
| Empresas aprobadas y pendientes | Por estado (y aprobadas en el mes) |
| Ofertas activas | Ofertas `PUBLICADA` y `EN_PROCESO_SELECCION` |
| Publicadas este mes | Ofertas cuya fecha de publicación cae en el mes actual |
| Cerradas este mes | Ofertas `CERRADA` cuya última modificación cae en el mes actual (una oferta cerrada ya no se edita, así que esa fecha es la del cierre) |
| Tasa de contratación | Postulaciones `CONTRATADO` / total de postulaciones x 100 |
| Gráficos | Postulaciones de los últimos 6 meses, postulantes por profesión (5 principales y "Otras"), empresas aprobadas por rubro |

El mes se toma en hora de Bolivia (UTC-4).

### Reportes

`GET /api/admin/reports/:type?format=xlsx|pdf` con filtros de fechas y, según el reporte, estado, municipio o rubro. Llevan el membrete de la Gobernación (escudo, nombre de la institución y de la Unidad), la fecha de emisión y quién los emitió.

| Reporte | Contenido | Rango de fechas sobre |
|---|---|---|
| Empresas | NIT, razón social, rubro, municipio, registro, estado | Fecha de registro |
| Postulantes | CI, nombre, profesión, municipio, celular, % de perfil | Fecha de registro |
| Ofertas | Título, empresa, municipio, publicación, cierre, plazas, postulantes, estado (sin borradores salvo que se pidan) | Fecha de creación |
| Contrataciones por empresa | Empresa, NIT, rubro, ofertas con contratación, contratados | Fecha del último cambio de estado de la postulación |

Cada reporte tiene un tope de 5000 filas; si se alcanza, el resumen lo indica.

## 13. Escalabilidad

Decisiones que permiten crecer sin rehacer el sistema:

- **Backend sin estado:** la sesión vive en el JWT, no en la memoria del servidor. Se pueden levantar varias instancias del backend detrás de un balanceador sin cambios en el código.
- **Separación frontend y backend:** el frontend es un sitio estático (se puede servir desde una CDN) y la API puede escalar por separado. La misma API puede atender a una futura aplicación móvil nativa.
- **Módulos independientes:** cada funcionalidad es un módulo de NestJS con su controlador, servicio y entidades. Agregar un módulo (por ejemplo, ferias de empleo o capacitaciones) no obliga a tocar los demás.
- **Base de datos:** índices en las búsquedas frecuentes (estado y fecha de cierre de ofertas, claves únicas en CI, NIT, correo y postulaciones). Los cambios de estructura se hacen con migraciones versionadas, sin perder datos. TiDB es compatible con MySQL y escala horizontalmente si el volumen crece.
- **Paginación** en los listados que pueden crecer (ofertas, postulaciones, favoritos, empresas, notificaciones y auditoría), con un máximo de 100 registros por página.
- **Catálogos y configuración en la base:** rubros, profesiones, municipios, habilidades y el límite de ofertas se administran desde el panel, sin cambiar código. Se pueden agregar los municipios de otros departamentos desde Administración → Catálogos.
- **Carga diferida en el frontend:** las pantallas del administrador (y la librería de gráficos) solo se descargan cuando se usan.

Mejoras recomendadas si el uso crece:

| Situación | Mejora |
|---|---|
| Muchos archivos subidos o varias instancias del backend | Mover `uploads/` a un almacenamiento de objetos (bucket S3 o similar). |
| Muchos correos por día | Plan pagado de Brevo o un servicio de correo transaccional; enviar los avisos masivos con una cola de trabajos. |
| Aprobar una oferta de una profesión con miles de postulantes | Enviar los avisos de "nueva oferta" en segundo plano con una cola, para no demorar la respuesta. |
| Dashboard con datos muy grandes | Guardar un resumen diario de indicadores y calcular solo el día actual. |
| Varias instancias y tareas programadas | Ejecutar las tareas en una sola instancia o con un bloqueo en la base. |

## 14. Decisiones respecto a las bases del concurso

| Tema | Decisión | Motivo |
|---|---|---|
| Verificación OTP | Se verifica el **correo** con un código de 6 dígitos. El celular se registra como dato de contacto, pero no se verifica. | Las bases dicen "Celular (validación OTP)", pero los proveedores de SMS no ofrecen prueba gratuita en Bolivia. El correo cumple el mismo objetivo: confirmar que la persona controla el medio de contacto. |
| Librería de contraseñas | `bcryptjs` en lugar de `bcrypt` | Es el mismo algoritmo bcrypt de 10 rondas, escrito en JavaScript; evita compilar código nativo en Windows y en el hosting. |
| Municipios | Se cargan los 9 departamentos de Bolivia y los municipios de Oruro. | El sistema es departamental. Se pueden agregar otros municipios desde el panel de catálogos. |
| Documento de respaldo de la empresa | Obligatorio (PDF con el NIT) | La Gobernación necesita un respaldo para validar a la empresa. |
| Indicadores del dashboard | Se calculan en cada carga | Siempre muestran datos actuales; ver la sección 13 para volúmenes grandes. |
| Tipos de contrato | Indefinido, Plazo fijo, **Eventual**, Pasantía y Consultoría | Se agregó "Eventual", un tipo de contrato común en Bolivia. Se pueden cambiar desde el panel. |
| Base de datos de la demo | TiDB Cloud (compatible con MySQL 8) | El desarrollo y las migraciones usan MySQL 8; TiDB ofrece un plan gratuito permanente con TLS. |
| WhatsApp | No implementado | Se cubren las notificaciones internas, por correo y push. |
| Empresas rechazadas | Ven el motivo y la indicación de comunicarse con la Unidad de Empleo | El flujo "corregir y reenviar" no está en las bases. |

## 15. Mantenimiento

- **Cambios en la base:** modificar la entidad, luego `npm run migration:generate -- src/database/migrations/NombreDelCambio` y `npm run migration:run`. Para deshacer la última: `npm run migration:revert`.
- **Registros del servidor:** NestJS escribe en la salida estándar (en Render, pestaña Logs). Los fallos de correo, push y tareas programadas quedan registrados sin detener el sistema.
- **Auditoría:** se consulta desde Administración → Auditoría con filtros por fecha, usuario, acción y tabla.
- **Dependencias:** revisar con `npm audit` en `backend` y `frontend`. A la fecha de entrega `npm audit` reporta un aviso moderado en una dependencia interna de `exceljs` (`uuid`) que no afecta al sistema, porque `exceljs` no la usa de la forma vulnerable; la única corrección automática bajaría `exceljs` a una versión incompatible.
- **Respaldo:** `mysqldump` de la base (o la exportación de TiDB) y una copia de la carpeta `uploads/`.

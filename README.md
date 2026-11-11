# Bolsa de Trabajo Departamental Digital

Sistema web (PWA) que conecta a postulantes del departamento de Oruro con empresas validadas por el Gobierno Autónomo Departamental de Oruro (G.A.D.OR.). Las empresas publican ofertas que la Gobernación revisa; los postulantes completan su hoja de vida, postulan y siguen su proceso; la Gobernación tiene dashboard, reportes y auditoría.

## Demo

- Aplicación: https://bolsa-trabajo-gador.netlify.app
- API y documentación (Swagger): https://bolsa-trabajo-gador-api.onrender.com/api/docs

El backend usa un plan gratuito que se suspende sin visitas: la primera carga puede tardar cerca de un minuto.

### Usuarios de prueba

La demo tiene datos ficticios para probar todas las funciones. Las contraseñas se entregan en el correo de envío del proyecto.

| Rol | Correo | Qué tiene |
|---|---|---|
| Administrador (Gobernación) | Se indica en el correo de envío | Dashboard, validación, reportes, catálogos, auditoría |
| Empresa aprobada | `sistemas.andinos@demo.bo` | 3 ofertas (publicadas y cerrada) con postulantes |
| Empresa aprobada | `minera.poopo@demo.bo` | Ofertas publicada, en selección y en revisión |
| Empresa pendiente | `comercial.altiplano@demo.bo` | Espera la validación de la Gobernación |
| Postulante | `postulante@demo.bo` | Perfil al 100 %, CV, postulaciones y favoritos |
| Postulantes adicionales | `carlos.mamani@demo.bo`, `lucia.flores@demo.bo` y otros `@demo.bo` | Perfiles al 85 % con postulaciones en distintos estados |

También se puede crear una cuenta nueva de postulante o de empresa; el código de verificación llega por correo (revisar Spam o Promociones).

## Funcionalidades

- **Postulantes:** registro con verificación del correo, hoja de vida (formación, experiencia, habilidades, idiomas, foto y CV en PDF), búsqueda con filtros, favoritos, postulación con porcentaje de coincidencia y seguimiento de estados.
- **Empresas:** registro con documento de respaldo, ofertas con flujo de estados (borrador, revisión, publicada, selección, cerrada o anulada), postulantes ordenados por coincidencia, descarga de CV y cambio de estado.
- **Gobernación:** validación de empresas y ofertas, dashboard con indicadores y gráficos, reportes en Excel y PDF con membrete, catálogos, configuración y auditoría.
- **Para todos:** notificaciones internas, por correo y push en el celular; aplicación instalable (PWA).

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | NestJS, TypeScript, TypeORM (migraciones), JWT, bcryptjs |
| Base de datos | MySQL 8 |
| Frontend | Angular, Bootstrap 5.3, Chart.js |
| PWA | Service worker de Angular y avisos push (web-push) |
| Reportes | exceljs y pdfmake |

## Instalación local

Requisitos: Node.js 22 o superior, Docker Desktop y Git.

```
git clone https://github.com/Rodribs01/bolsa-trabajo-gador.git
cd bolsa-trabajo-gador
cp .env.example .env
```

Completar los valores de `.env` (la explicación de cada variable está en el [manual técnico](docs/manual_tecnico.md#7-configuración-variables-de-entorno)). Luego:

```
docker compose up -d

cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```

```
cd frontend
npm install
npx ng serve
```

- Sistema: http://localhost:4200
- API: http://localhost:3000/api y Swagger en http://localhost:3000/api/docs
- `npm run seed` crea los roles, catálogos, habilidades, configuración y el administrador (`ADMIN_EMAIL` y `ADMIN_PASSWORD`).
- Con `MAIL_DRIVER=consola` los códigos y enlaces de correo se muestran en la terminal del backend.

### Datos de demostración (opcional)

Con `DEMO_PASSWORD` definida en `.env`, dentro de `backend`:

```
npm run seed:demo
npm run demo-files
```

`seed:demo` carga las empresas, ofertas, postulantes y postulaciones de ejemplo de la tabla de usuarios de prueba (solo una vez). `demo-files` copia sus fotos, logos, CV y documentos a `uploads/` si faltan. En una instalación real para la Gobernación no se define `DEMO_PASSWORD` y la base empieza vacía.

### Base de datos con el script SQL

Como alternativa a las migraciones, [`database/bolsa_trabajo.sql`](database/bolsa_trabajo.sql) crea la base `bolsa_trabajo` con todas las tablas y los datos iniciales:

```
mysql -u root -p < database/bolsa_trabajo.sql
```

El script ya registra las migraciones aplicadas, así que después no hace falta `npm run migration:run`. Sí hay que ejecutar `npm run seed` para crear el administrador.

## Documentación

- [Manual técnico](docs/manual_tecnico.md): arquitectura, seguridad, configuración, despliegue, reglas de negocio y escalabilidad.
- [Manual de usuario](docs/manual_usuario.md): pasos para postulantes, empresas y la Gobernación.
- [Diccionario de datos](database/diccionario_datos.md)
- [Diagrama entidad relación](database/diagrama_er.png)
- [Script SQL](database/bolsa_trabajo.sql)

## Estructura

```
backend/    API NestJS (módulos, entidades, migraciones y seeders)
frontend/   Aplicación Angular (PWA)
database/   Script SQL, diagrama entidad relación y diccionario de datos
docs/       Manual técnico y manual de usuario
```

## Seguridad

Contraseñas con bcrypt de 10 rondas (librería bcryptjs), JWT en la cabecera Authorization (sin cookies, por lo que no aplica CSRF), guards por rol y por dueño del registro, validación de todas las entradas, helmet, CORS restringido, límite de peticiones, validación de archivos y auditoría. Las credenciales van en `.env`, que no se sube al repositorio; `.env.example` lista las variables sin valores. Detalle en el [manual técnico](docs/manual_tecnico.md#5-seguridad-aplicada).

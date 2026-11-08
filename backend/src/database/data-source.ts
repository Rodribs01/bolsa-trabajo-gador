import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Lee el .env de la raíz del repositorio, el mismo que usa docker compose
config({ path: ['../.env', '.env'], quiet: true });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
  // Devuelve las columnas decimal como números y no como texto
  extra: { decimalNumbers: true },
};

export default new DataSource(dataSourceOptions);

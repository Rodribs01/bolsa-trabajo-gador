import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

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
  extra: { decimalNumbers: true },
};

export default new DataSource(dataSourceOptions);

import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config({ path: ['../.env', '.env'], quiet: true });

function sslOptions() {
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }
  const ca = process.env.DB_SSL_CA ?? '';
  if (!ca) {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return { ca: ca.replaceAll('\\n', '\n') };
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: 'Z',
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
  extra: { decimalNumbers: true },
  ssl: sslOptions(),
};

export default new DataSource(dataSourceOptions);

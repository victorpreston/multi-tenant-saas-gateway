import { DataSource, DataSourceOptions } from 'typeorm';
import { EnvironmentVariables } from '../../config/validation';
import { Tenant, User, Role, Permission, ApiKey, AuditLog } from '../entities';

/**
 * Create TypeORM DataSourceOptions from environment variables
 */
export function getTypeOrmConfig(env: EnvironmentVariables): DataSourceOptions {
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    type: 'postgres',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
    entities: [Tenant, User, Role, Permission, ApiKey, AuditLog],
    migrations: ['src/database/migrations/*.ts'],
    subscribers: [],
    synchronize: isDevelopment, // Only in development
    logging: isDevelopment,
    logger: 'advanced-console',
  };
}

/**
 * Create DataSource instance for TypeORM CLI migrations
 * Used for: typeorm migration:create, typeorm migration:run
 */
export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'gateway_user',
  password: process.env.DATABASE_PASSWORD || 'gateway_password',
  database: process.env.DATABASE_NAME || 'saas_gateway_db',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Tenant, User, Role, Permission, ApiKey, AuditLog],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  synchronize: false,
  logging: false,
});

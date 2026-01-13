import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),

  // Database (PostgreSQL)
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_URL: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
  REDIS_URL: Joi.string().optional(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Kafka
  KAFKA_BROKERS: Joi.string().default('localhost:9092'),
  KAFKA_GROUP_ID: Joi.string().default('saas-gateway'),
  KAFKA_CLIENT_ID: Joi.string().default('saas-gateway-client'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Monitoring
  PROMETHEUS_ENABLED: Joi.boolean().default(true),
  PROMETHEUS_PORT: Joi.number().default(9090),

  // AWS
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
});

export type EnvironmentVariables = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  DATABASE_SSL: boolean;
  DATABASE_URL?: string;

  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  REDIS_URL?: string;

  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRATION: string;

  KAFKA_BROKERS: string;
  KAFKA_GROUP_ID: string;
  KAFKA_CLIENT_ID: string;

  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  PROMETHEUS_ENABLED: boolean;
  PROMETHEUS_PORT: number;

  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
};

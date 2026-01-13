import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant, User, Role, Permission, ApiKey, AuditLog } from '../entities';

/**
 * Database module - Handles all database configuration and entity registration
 * Dynamically configures TypeORM based on environment variables
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';
        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          ssl: configService.get('DATABASE_SSL')
            ? { rejectUnauthorized: false }
            : false,
          entities: [Tenant, User, Role, Permission, ApiKey, AuditLog],
          migrations: ['src/database/migrations/*.ts'],
          synchronize: isDevelopment,
          logging: isDevelopment,
        };
      },
      inject: [ConfigService],
    }),
    // Register entities for dependency injection
    TypeOrmModule.forFeature([
      Tenant,
      User,
      Role,
      Permission,
      ApiKey,
      AuditLog,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.use(compression());

  const rawOrigins = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  const corsOrigins = rawOrigins.split(',').map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-tenant-id',
      'x-request-id',
    ],
    exposedHeaders: ['x-request-id'],
    credentials: true,
    maxAge: 86400,
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant SaaS Gateway API')
    .setDescription(
      'Production-grade API gateway for multi-tenant SaaS applications.\n\n' +
        '**Authentication:** Pass `Authorization: Bearer <token>` for JWT routes or `x-api-key: <key>` for API-key routes.\n\n' +
        '**Tenant isolation:** All protected routes require the `x-tenant-id` header.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Victor Preston',
      'https://github.com/victorpreston',
      'prestonvictor25@gmail.com',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'ApiKey')
    .addTag('health', 'Health & readiness probes')
    .addTag('auth', 'Authentication & token management')
    .addTag('tenants', 'Tenant management')
    .addTag('users', 'User management (tenant-scoped)')
    .addTag('api-keys', 'API key management')
    .addTag('rbac', 'Role-based access control')
    .addTag('audit-logs', 'Audit log queries')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger UI at http://localhost:${port}/api/docs`);
}
void bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Global validation pipe — strips unknown fields, enforces class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — consistent error shapes
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global request/response logger with correlation IDs
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI documentation
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`API docs available at http://localhost:${port}/api/docs`);
}
void bootstrap();

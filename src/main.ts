import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant SaaS Gateway API')
    .setDescription(
      'Production-grade API gateway for multi-tenant SaaS applications',
    )
    .setVersion('0.0.1')
    .setContact(
      'Victor Preston',
      'https://github.com/victorpreston',
      'vp.prestonvictor@gmail.com',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('general', 'General endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

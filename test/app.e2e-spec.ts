import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import helmet from 'helmet';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters';
import { LoggingInterceptor } from './../src/common/interceptors';

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();

  app.use(helmet());
  app.setGlobalPrefix('api');
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

  await app.init();
  return app;
}

describe('Health endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns 200 with status ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status: string;
          info: Record<string, { status: string }>;
        };
        expect(body.status).toBe('ok');
        expect(body.info['api-gateway'].status).toBe('up');
      });
  });

  it('GET /api/ready returns 200 with status ok', () => {
    return request(app.getHttpServer())
      .get('/api/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status: string;
          info: Record<string, { status: string }>;
        };
        expect(body.status).toBe('ok');
        expect(body.info['api-gateway'].status).toBe('ready');
      });
  });
});

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register returns 400 when body is missing', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .send({})
      .expect(400);
  });

  it('POST /api/auth/login returns 400 when body is missing', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .send({})
      .expect(400);
  });

  it('POST /api/auth/register returns 400 when tenantId is invalid UUID', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-tenant-id', 'not-a-uuid')
      .send({
        email: 'user@example.com',
        name: 'Test User',
        password: 'password123',
        tenantId: 'not-a-uuid',
      })
      .expect(400);
  });
});

describe('Protected endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/users returns 401 without JWT', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .expect(401);
  });

  it('GET /api/tenants returns 400 without x-tenant-id header', () => {
    return request(app.getHttpServer()).get('/api/tenants').expect(400);
  });

  it('GET /api/rbac/roles returns 401 without JWT', () => {
    return request(app.getHttpServer())
      .get('/api/rbac/roles')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .expect(401);
  });

  it('GET /api/audit-logs returns 401 without JWT', () => {
    return request(app.getHttpServer())
      .get('/api/audit-logs')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .expect(401);
  });

  it('GET /api/api-keys returns 401 without JWT', () => {
    return request(app.getHttpServer())
      .get('/api/api-keys')
      .set('x-tenant-id', '00000000-0000-0000-0000-000000000001')
      .expect(401);
  });
});

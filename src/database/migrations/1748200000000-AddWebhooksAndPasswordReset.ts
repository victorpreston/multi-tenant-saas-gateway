import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhooksAndPasswordReset1748200000000 implements MigrationInterface {
  name = 'AddWebhooksAndPasswordReset1748200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "webhooks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "tenantId" uuid NOT NULL,
        "url" character varying(500) NOT NULL,
        "description" character varying(255),
        "events" text NOT NULL,
        "secret" character varying(255) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "maxRetries" integer NOT NULL DEFAULT 3,
        "deliveryCount" integer NOT NULL DEFAULT 0,
        "failureCount" integer NOT NULL DEFAULT 0,
        "lastDeliveredAt" TIMESTAMP,
        CONSTRAINT "PK_webhooks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_webhooks_tenantId" ON "webhooks" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_webhooks_isActive" ON "webhooks" ("isActive")
    `);
    await queryRunner.query(`
      ALTER TABLE "webhooks"
      ADD CONSTRAINT "FK_webhooks_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "tenantId" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prt_userId" ON "password_reset_tokens" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_prt_token" ON "password_reset_tokens" ("token")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_prt_expiresAt" ON "password_reset_tokens" ("expiresAt")
    `);
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "FK_prt_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhooks"`);
  }
}

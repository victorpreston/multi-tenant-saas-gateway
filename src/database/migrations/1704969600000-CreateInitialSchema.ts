import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1704969600000 implements MigrationInterface {
  name = 'CreateInitialSchema1704969600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "public"."tenants_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."api_keys_status_enum" AS ENUM('ACTIVE', 'REVOKED', 'EXPIRED')`,
    );

    // Create tenants table
    await queryRunner.query(
      `CREATE TABLE "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(100) NOT NULL UNIQUE,
        "description" text,
        "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "website" character varying(255),
        "logo" character varying(255),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "subscription" jsonb NOT NULL DEFAULT '{"maxUsers":10,"maxApiKeys":5}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_slug" ON "tenants" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_status" ON "tenants" ("status")`,
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING',
        "emailVerified" boolean NOT NULL DEFAULT false,
        "emailVerifiedAt" TIMESTAMP,
        "lastLoginAt" TIMESTAMP,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_users_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_tenantId" ON "users" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_tenantId_email" ON "users" ("tenantId", "email")`,
    );

    // Create roles table
    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "isSystem" boolean NOT NULL DEFAULT false,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "ownerId" uuid,
        CONSTRAINT "FK_roles_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_roles_ownerId" FOREIGN KEY ("ownerId") REFERENCES "users" ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_roles_tenantId" ON "roles" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_roles_tenantId_name" ON "roles" ("tenantId", "name")`,
    );

    // Create permissions table
    await queryRunner.query(
      `CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "resource" character varying(100) NOT NULL,
        "action" character varying(50) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_permissions_resource" ON "permissions" ("resource")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_permissions_action" ON "permissions" ("action")`,
    );

    // Create role_permissions junction table
    await queryRunner.query(
      `CREATE TABLE "role_permissions" (
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        PRIMARY KEY ("roleId", "permissionId"),
        CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE
      )`,
    );

    // Create api_keys table
    await queryRunner.query(
      `CREATE TABLE "api_keys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "key" character varying(255) NOT NULL UNIQUE,
        "secret" text NOT NULL,
        "status" "public"."api_keys_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "expiresAt" TIMESTAMP,
        "lastUsedAt" TIMESTAMP,
        "scopes" text[] NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_api_keys_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_api_keys_tenantId_name" UNIQUE ("tenantId", "name")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_tenantId" ON "api_keys" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_key" ON "api_keys" ("key")`,
    );

    // Create audit_logs table
    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL,
        "userId" uuid,
        "action" character varying(100) NOT NULL,
        "resourceType" character varying(50) NOT NULL,
        "resourceId" uuid,
        "changes" jsonb NOT NULL DEFAULT '{}',
        "status" character varying(50) NOT NULL,
        "errorMessage" text,
        "ipAddress" character varying(50),
        "userAgent" character varying(500),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "FK_audit_logs_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_tenantId" ON "audit_logs" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "public"."api_keys_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
  }
}

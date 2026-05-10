import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRolesAndSystemPermissions1748000000000 implements MigrationInterface {
  name = 'AddUserRolesAndSystemPermissions1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_roles" (
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        PRIMARY KEY ("userId", "roleId"),
        CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE CASCADE
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_user_roles_userId" ON "user_roles" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_roles_roleId" ON "user_roles" ("roleId")`,
    );

    await queryRunner.query(
      `INSERT INTO "permissions" ("resource", "action", "description") VALUES
        ('tenants', 'create', 'Create new tenants'),
        ('tenants', 'read', 'Read tenant information'),
        ('tenants', 'update', 'Update tenant information'),
        ('tenants', 'delete', 'Delete tenants'),
        ('users', 'create', 'Create new users'),
        ('users', 'read', 'Read user information'),
        ('users', 'update', 'Update user information'),
        ('users', 'delete', 'Delete users'),
        ('api-keys', 'create', 'Create API keys'),
        ('api-keys', 'read', 'Read API keys'),
        ('api-keys', 'update', 'Update API keys'),
        ('api-keys', 'delete', 'Delete API keys'),
        ('api-keys', 'rotate', 'Rotate API key secrets'),
        ('roles', 'create', 'Create roles'),
        ('roles', 'read', 'Read roles'),
        ('roles', 'update', 'Update roles'),
        ('roles', 'delete', 'Delete roles'),
        ('audit-logs', 'read', 'Read audit logs')
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_roles_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_roles_userId"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DELETE FROM "permissions"`);
  }
}

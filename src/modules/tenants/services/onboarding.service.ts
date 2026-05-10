import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../database/entities/role.entity';
import { Permission } from '../../../database/entities/permission.entity';

interface DefaultRole {
  name: string;
  description: string;
  permissions: string[];
}

const DEFAULT_ROLES: DefaultRole[] = [
  {
    name: 'admin',
    description: 'Full access to all resources',
    permissions: ['*:*'],
  },
  {
    name: 'member',
    description: 'Standard member access',
    permissions: ['users:read', 'api-keys:read', 'api-keys:create'],
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    permissions: ['users:read'],
  },
];

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async initializeTenant(tenantId: string): Promise<void> {
    const existingRoles = await this.roleRepository.find({
      where: { tenantId },
    });
    if (existingRoles.length > 0) {
      this.logger.debug(
        `Tenant ${tenantId} already has roles — skipping onboarding`,
      );
      return;
    }

    const allPermissions = await this.permissionRepository.find({
      where: { isActive: true },
    });

    for (const defaultRole of DEFAULT_ROLES) {
      const matchingPerms = allPermissions.filter(
        (p) =>
          defaultRole.permissions.includes(`${p.resource}:${p.action}`) ||
          defaultRole.permissions.includes('*:*'),
      );

      const role = this.roleRepository.create({
        tenantId,
        name: defaultRole.name,
        description: defaultRole.description,
        isSystem: true,
        permissions: matchingPerms,
      });

      await this.roleRepository.save(role);
    }

    this.logger.log(
      `Tenant ${tenantId} onboarding complete — ${DEFAULT_ROLES.length} default roles created`,
    );
  }
}

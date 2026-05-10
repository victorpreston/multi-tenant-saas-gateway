import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { CacheService } from '../redis/cache.service';
import { PermissionRequirement } from '../../common/decorators/require-permissions.decorator';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly cacheTtl = 300;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly cacheService: CacheService,
  ) {}

  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<PermissionRequirement[]> {
    const cacheKey = `rbac:perms:${tenantId}:${userId}`;
    const cached =
      await this.cacheService.get<PermissionRequirement[]>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return [];

    const permissions: PermissionRequirement[] = [];
    const seen = new Set<string>();

    for (const role of user.roles ?? []) {
      for (const perm of role.permissions ?? []) {
        if (!perm.isActive) continue;
        const key = `${perm.resource}:${perm.action}`;
        if (!seen.has(key)) {
          seen.add(key);
          permissions.push({ resource: perm.resource, action: perm.action });
        }
      }
    }

    await this.cacheService.set(cacheKey, permissions, this.cacheTtl);
    return permissions;
  }

  async getUserRoleNames(userId: string, tenantId: string): Promise<string[]> {
    const cacheKey = `rbac:roles:${tenantId}:${userId}`;
    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });

    if (!user) return [];

    const roleNames = (user.roles ?? []).map((r) => r.name);
    await this.cacheService.set(cacheKey, roleNames, this.cacheTtl);
    return roleNames;
  }

  hasPermission(
    userPermissions: PermissionRequirement[],
    required: PermissionRequirement[],
  ): boolean {
    return required.every((req) =>
      userPermissions.some(
        (p) => p.resource === req.resource && p.action === req.action,
      ),
    );
  }

  hasRole(userRoles: string[], required: string[]): boolean {
    return required.some((r) => userRoles.includes(r));
  }

  async invalidateUserRbacCache(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await Promise.all([
      this.cacheService.del(`rbac:perms:${tenantId}:${userId}`),
      this.cacheService.del(`rbac:roles:${tenantId}:${userId}`),
    ]);
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    const [user, role] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId, tenantId },
        relations: ['roles'],
      }),
      this.roleRepository.findOne({ where: { id: roleId, tenantId } }),
    ]);

    if (!user || !role) {
      throw new Error('User or role not found in this tenant');
    }

    const alreadyAssigned = (user.roles ?? []).some((r) => r.id === roleId);
    if (!alreadyAssigned) {
      user.roles = [...(user.roles ?? []), role];
      await this.userRepository.save(user);
      await this.invalidateUserRbacCache(userId, tenantId);
    }
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });

    if (!user) throw new Error('User not found in this tenant');

    user.roles = (user.roles ?? []).filter((r) => r.id !== roleId);
    await this.userRepository.save(user);
    await this.invalidateUserRbacCache(userId, tenantId);
  }

  async createRole(
    tenantId: string,
    name: string,
    description?: string,
    permissionIds?: string[],
  ): Promise<Role> {
    const permissions = permissionIds?.length
      ? await this.permissionRepository.findByIds(permissionIds)
      : [];

    const role = this.roleRepository.create({
      tenantId,
      name,
      description,
      isSystem: false,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async listRoles(tenantId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId },
      relations: ['permissions'],
    });
  }

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({ where: { isActive: true } });
  }

  async deleteRole(roleId: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, tenantId },
    });
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system roles');
    await this.roleRepository.remove(role);
  }
}

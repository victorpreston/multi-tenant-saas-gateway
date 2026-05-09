import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RbacService } from './rbac.service';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { CacheService } from '../redis/cache.service';

const makeRole = (overrides: Partial<Role> = {}): Role =>
  ({
    id: 'role-id',
    name: 'admin',
    tenantId: 'tenant-id',
    isSystem: false,
    permissions: [],
    ...overrides,
  }) as Role;

const makePermission = (overrides: Partial<Permission> = {}): Permission =>
  ({
    id: 'perm-id',
    resource: 'users',
    action: 'read',
    isActive: true,
    ...overrides,
  }) as Permission;

describe('RbacService', () => {
  let service: RbacService;

  const mockUserRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockRoleRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findByIds: jest.fn(),
  };
  const mockPermissionRepo = { find: jest.fn(), findByIds: jest.fn() };
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepo,
        },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get(RbacService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(undefined);
    mockCache.del.mockResolvedValue(undefined);
  });

  describe('hasPermission', () => {
    it('returns true when all required permissions are present', () => {
      const userPerms = [
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'create' },
      ];
      const required = [{ resource: 'users', action: 'read' }];
      expect(service.hasPermission(userPerms, required)).toBe(true);
    });

    it('returns false when a required permission is missing', () => {
      const userPerms = [{ resource: 'users', action: 'read' }];
      const required = [{ resource: 'users', action: 'delete' }];
      expect(service.hasPermission(userPerms, required)).toBe(false);
    });

    it('returns true when required list is empty', () => {
      expect(service.hasPermission([], [])).toBe(true);
    });

    it('returns false when user has no permissions', () => {
      const required = [{ resource: 'users', action: 'read' }];
      expect(service.hasPermission([], required)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('returns true when user has at least one required role', () => {
      expect(service.hasRole(['admin', 'viewer'], ['admin'])).toBe(true);
    });

    it('returns false when user has none of the required roles', () => {
      expect(service.hasRole(['viewer'], ['admin'])).toBe(false);
    });

    it('returns false when user has no roles', () => {
      expect(service.hasRole([], ['admin'])).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('returns cached permissions on cache hit', async () => {
      const cached = [{ resource: 'users', action: 'read' }];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.getUserPermissions('user-id', 'tenant-id');
      expect(result).toEqual(cached);
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns empty array when user is not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.getUserPermissions('missing', 'tenant-id');
      expect(result).toEqual([]);
    });

    it('returns deduplicated permissions from all roles', async () => {
      mockCache.get.mockResolvedValue(null);
      const perm = makePermission();
      const user = {
        id: 'user-id',
        tenantId: 'tenant-id',
        roles: [
          makeRole({ permissions: [perm] }),
          makeRole({ id: 'role-2', permissions: [perm] }),
        ],
      };
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserPermissions('user-id', 'tenant-id');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ resource: 'users', action: 'read' });
    });

    it('skips inactive permissions', async () => {
      mockCache.get.mockResolvedValue(null);
      const inactivePerm = makePermission({ isActive: false });
      const user = {
        id: 'user-id',
        tenantId: 'tenant-id',
        roles: [makeRole({ permissions: [inactivePerm] })],
      };
      mockUserRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserPermissions('user-id', 'tenant-id');
      expect(result).toHaveLength(0);
    });
  });

  describe('listRoles', () => {
    it('returns all roles for a tenant', async () => {
      mockRoleRepo.find.mockResolvedValue([makeRole()]);
      const result = await service.listRoles('tenant-id');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('admin');
    });

    it('returns empty array when tenant has no roles', async () => {
      mockRoleRepo.find.mockResolvedValue([]);
      const result = await service.listRoles('tenant-id');
      expect(result).toHaveLength(0);
    });
  });

  describe('listPermissions', () => {
    it('returns only active permissions', async () => {
      mockPermissionRepo.find.mockResolvedValue([makePermission()]);
      const result = await service.listPermissions();
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('deleteRole', () => {
    it('throws when role is not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteRole('missing', 'tenant-id')).rejects.toThrow(
        'Role not found',
      );
    });

    it('throws when trying to delete a system role', async () => {
      mockRoleRepo.findOne.mockResolvedValue(makeRole({ isSystem: true }));
      await expect(service.deleteRole('role-id', 'tenant-id')).rejects.toThrow(
        'Cannot delete system roles',
      );
    });

    it('removes the role successfully', async () => {
      const role = makeRole();
      mockRoleRepo.findOne.mockResolvedValue(role);
      mockRoleRepo.remove.mockResolvedValue(role);

      await service.deleteRole('role-id', 'tenant-id');
      expect(mockRoleRepo.remove).toHaveBeenCalledWith(role);
    });
  });
});

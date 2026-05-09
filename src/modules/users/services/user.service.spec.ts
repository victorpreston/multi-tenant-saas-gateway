import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { Tenant } from '../../../database/entities/tenant.entity';
import { EventPublisherService } from '../../../common/services';
import { CacheService } from '../../redis/cache.service';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: USER_ID,
    email: 'user@example.com',
    name: 'Test User',
    tenantId: TENANT_ID,
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as User;

const makeTenant = (): Tenant => ({ id: TENANT_ID }) as Tenant;

describe('UserService', () => {
  let service: UserService;

  const mockUserRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockTenantRepo = { findOne: jest.fn() };
  const mockEventPublisher = {
    publishUserCreated: jest.fn(),
    publishUserUpdated: jest.fn(),
    publishUserDeleted: jest.fn(),
  };
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidateUser: jest.fn(),
    getUserKey: jest.fn((id: string) => `user:${id}`),
    getUserListKey: jest.fn((tid: string) => `users:${tid}:list`),
  };
  const mockConfig = { get: jest.fn().mockReturnValue(300) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: EventPublisherService, useValue: mockEventPublisher },
        { provide: CacheService, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(UserService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(undefined);
    mockCache.del.mockResolvedValue(undefined);
    mockCache.invalidateUser.mockResolvedValue(undefined);
  });

  describe('create', () => {
    const payload = {
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('throws NotFoundException when tenant does not exist', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);
      await expect(service.create(TENANT_ID, payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when email already exists in tenant', async () => {
      mockTenantRepo.findOne.mockResolvedValue(makeTenant());
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.create(TENANT_ID, payload)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates and returns user with ACTIVE status', async () => {
      mockTenantRepo.findOne.mockResolvedValue(makeTenant());
      mockUserRepo.findOne.mockResolvedValue(null);
      const user = makeUser();
      mockUserRepo.create.mockReturnValue(user);
      mockUserRepo.save.mockResolvedValue(user);

      const result = await service.create(TENANT_ID, payload);
      expect(result.tenantId).toBe(TENANT_ID);
      expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns cached user when cache hit belongs to correct tenant', async () => {
      const cached = { id: USER_ID, tenantId: TENANT_ID };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findById(TENANT_ID, USER_ID);
      expect(result).toEqual(cached);
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
    });

    it('ignores cache when tenantId does not match', async () => {
      mockCache.get.mockResolvedValue({
        id: USER_ID,
        tenantId: 'other-tenant',
      });
      mockUserRepo.findOne.mockResolvedValue(makeUser());

      await service.findById(TENANT_ID, USER_ID);
      expect(mockUserRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when user is not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(TENANT_ID, 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByTenant', () => {
    it('returns cached list on cache hit', async () => {
      const cached = [{ id: USER_ID, tenantId: TENANT_ID }];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAllByTenant(TENANT_ID);
      expect(result).toEqual(cached);
      expect(mockUserRepo.find).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockUserRepo.find.mockResolvedValue([makeUser()]);

      const result = await service.findAllByTenant(TENANT_ID);
      expect(result).toHaveLength(1);
      expect(mockCache.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update(TENANT_ID, USER_ID, { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the user name and invalidates cache', async () => {
      const user = makeUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue({ ...user, name: 'New Name' });

      const result = await service.update(TENANT_ID, USER_ID, {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
      expect(mockCache.invalidateUser).toHaveBeenCalledWith(USER_ID, TENANT_ID);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.delete(TENANT_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes the user and invalidates cache', async () => {
      const user = makeUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.remove.mockResolvedValue(user);

      await service.delete(TENANT_ID, USER_ID);
      expect(mockUserRepo.remove).toHaveBeenCalledWith(user);
      expect(mockCache.invalidateUser).toHaveBeenCalledWith(USER_ID, TENANT_ID);
    });
  });
});

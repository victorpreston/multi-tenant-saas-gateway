import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { Tenant } from '../../../database/entities/tenant.entity';
import { TenantStatus } from '../enums';
import { EventPublisherService } from '../../../common/services';
import { CacheService } from '../../redis/cache.service';

const makeTenant = (overrides: Partial<Tenant> = {}): Tenant =>
  ({
    id: 'tenant-id',
    name: 'Acme Corp',
    slug: 'acme',
    description: 'Test tenant',
    status: TenantStatus.ACTIVE,
    website: null,
    logo: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Tenant;

describe('TenantService', () => {
  let service: TenantService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockEventPublisher = {
    publishTenantCreated: jest.fn(),
    publishTenantUpdated: jest.fn(),
    publishTenantDeleted: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delMultiple: jest.fn(),
    invalidateTenant: jest.fn(),
    getTenantKey: jest.fn((id: string) => `tenant:${id}`),
    getTenantListKey: jest.fn(() => 'tenants:list'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getRepositoryToken(Tenant), useValue: mockRepo },
        { provide: EventPublisherService, useValue: mockEventPublisher },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get(TenantService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue(undefined);
    mockCache.del.mockResolvedValue(undefined);
    mockCache.invalidateTenant.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('throws BadRequestException when slug is already taken', async () => {
      mockRepo.findOne.mockResolvedValue(makeTenant());
      await expect(
        service.create({ name: 'Other', slug: 'acme' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns a new tenant', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const tenant = makeTenant();
      mockRepo.create.mockReturnValue(tenant);
      mockRepo.save.mockResolvedValue(tenant);

      const result = await service.create({ name: 'Acme Corp', slug: 'acme' });
      expect(result.slug).toBe('acme');
      expect(mockEventPublisher.publishTenantCreated).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns cached tenant when available', async () => {
      const cached = { id: 'tenant-id', slug: 'acme' };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findById('tenant-id');
      expect(result).toEqual(cached);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findOne.mockResolvedValue(makeTenant());

      const result = await service.findById('tenant-id');
      expect(result.id).toBe('tenant-id');
      expect(mockCache.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('returns cached list when available', async () => {
      const cached = { data: [{ id: 'tenant-id', slug: 'acme' }], total: 1 };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAll();
      expect(result).toEqual(cached);
      expect(mockRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('fetches from DB and caches on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.findAndCount.mockResolvedValue([[makeTenant()], 1]);

      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockCache.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when tenant does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('missing-id', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when new slug is already taken', async () => {
      const existing = makeTenant({ slug: 'acme' });
      mockRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(makeTenant({ id: 'other', slug: 'new-slug' }));

      await expect(
        service.update('tenant-id', { slug: 'new-slug' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the tenant and invalidates cache', async () => {
      const tenant = makeTenant();
      mockRepo.findOne
        .mockResolvedValueOnce(tenant)
        .mockResolvedValueOnce(null);
      mockRepo.save.mockResolvedValue({ ...tenant, name: 'Updated' });

      const result = await service.update('tenant-id', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(mockCache.invalidateTenant).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when tenant does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes the tenant and invalidates cache', async () => {
      const tenant = makeTenant();
      mockRepo.findOne.mockResolvedValue(tenant);
      mockRepo.remove.mockResolvedValue(tenant);

      await service.delete('tenant-id');
      expect(mockRepo.remove).toHaveBeenCalledWith(tenant);
      expect(mockCache.invalidateTenant).toHaveBeenCalledWith('tenant-id');
      expect(mockEventPublisher.publishTenantDeleted).toHaveBeenCalledTimes(1);
    });
  });
});

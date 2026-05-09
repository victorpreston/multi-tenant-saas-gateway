import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../../database/entities/audit-log.entity';
import type { CreateAuditLogDto } from './audit.service';

const makeAuditLog = (overrides: Partial<AuditLog> = {}): AuditLog =>
  ({
    id: 'log-id',
    tenantId: 'tenant-id',
    action: 'user.create',
    resourceType: 'users',
    status: 'SUCCESS',
    changes: {},
    metadata: {},
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as AuditLog;

describe('AuditService', () => {
  let service: AuditService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    const dto: CreateAuditLogDto = {
      tenantId: 'tenant-id',
      action: 'user.create',
      resourceType: 'users',
      status: 'SUCCESS',
    };

    it('creates and saves an audit log entry', async () => {
      const log = makeAuditLog();
      mockRepo.create.mockReturnValue(log);
      mockRepo.save.mockResolvedValue(log);

      await service.log(dto);
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRepo.save).toHaveBeenCalledWith(log);
    });

    it('does not throw when save fails (fire-and-forget)', async () => {
      mockRepo.create.mockReturnValue(makeAuditLog());
      mockRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.log(dto)).resolves.toBeUndefined();
    });
  });

  describe('query', () => {
    it('returns paginated audit logs', async () => {
      const logs = [makeAuditLog()];
      mockRepo.findAndCount.mockResolvedValue([logs, 1]);

      const result = await service.query({ tenantId: 'tenant-id' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('defaults to page 1 and limit 50', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.query({ tenantId: 'tenant-id' });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });

    it('caps limit at 200', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.query({ tenantId: 'tenant-id', limit: 999 });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 200 }),
      );
    });

    it('applies page offset correctly', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.query({ tenantId: 'tenant-id', page: 3, limit: 10 });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('orders by createdAt descending', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.query({ tenantId: 'tenant-id' });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });
  });
});

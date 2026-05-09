import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE';
  changes?: Record<string, unknown>;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilter {
  tenantId: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      const entry = this.auditLogRepository.create({
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: dto.action,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        status: dto.status,
        changes: dto.changes ?? {},
        errorMessage: dto.errorMessage,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        metadata: dto.metadata ?? {},
      });
      await this.auditLogRepository.save(entry);
    } catch (err) {
      this.logger.warn(`Audit log write failed: ${String(err)}`);
    }
  }

  async query(
    filter: AuditLogFilter,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: FindManyOptions<AuditLog>['where'] = {
      tenantId: filter.tenantId,
    };

    if (filter.userId) Object.assign(where, { userId: filter.userId });
    if (filter.action) Object.assign(where, { action: filter.action });
    if (filter.resourceType)
      Object.assign(where, { resourceType: filter.resourceType });
    if (filter.status) Object.assign(where, { status: filter.status });
    if (filter.from && filter.to) {
      Object.assign(where, { createdAt: Between(filter.from, filter.to) });
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }
}

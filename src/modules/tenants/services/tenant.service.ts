import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../../database/entities/tenant.entity';
import {
  CreateTenantPayload,
  UpdateTenantPayload,
  TenantResponseDto,
} from '../interfaces';
import { TenantStatus, TenantErrorCode } from '../enums';
import { EventPublisherService } from '../../../common/services';
import { CacheService } from '../../redis/cache.service';
import { TenantCreatedEvent } from '../../../common/events/events';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
  ) {}

  async create(payload: CreateTenantPayload): Promise<TenantResponseDto> {
    // Check if slug already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: payload.slug },
    });

    if (existingTenant) {
      throw new BadRequestException({
        code: TenantErrorCode.DUPLICATE_SLUG,
        message: `Tenant with slug '${payload.slug}' already exists`,
      });
    }

    const tenant = this.tenantRepository.create({
      ...payload,
      status: TenantStatus.ACTIVE,
    });

    const saved = await this.tenantRepository.save(tenant);

    // Cache the newly created tenant
    await this.cacheService.set(
      this.cacheService.getTenantKey(saved.id),
      this.formatResponse(saved),
      300, // 5 minutes TTL
    );

    // Invalidate tenant list cache
    await this.cacheService.del(this.cacheService.getTenantListKey());

    // Publish tenant created event
    const tenantCreatedPayload: TenantCreatedEvent = {
      tenantId: saved.id,
      name: saved.name,
      slug: saved.slug,
      createdAt: saved.createdAt,
    };
    this.eventPublisher.publishTenantCreated(tenantCreatedPayload);

    return this.formatResponse(saved);
  }

  async findById(id: string): Promise<TenantResponseDto> {
    // Try to get from cache first
    const cached = await this.cacheService.get<TenantResponseDto>(
      this.cacheService.getTenantKey(id),
    );

    if (cached) {
      return cached;
    }

    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException({
        code: TenantErrorCode.TENANT_NOT_FOUND,
        message: `Tenant with ID '${id}' not found`,
      });
    }

    const response = this.formatResponse(tenant);

    // Cache the tenant
    await this.cacheService.set(
      this.cacheService.getTenantKey(id),
      response,
      300, // 5 minutes TTL
    );

    return response;
  }

  async findBySlug(slug: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });

    if (!tenant) {
      throw new NotFoundException({
        code: TenantErrorCode.TENANT_NOT_FOUND,
        message: `Tenant with slug '${slug}' not found`,
      });
    }

    return this.formatResponse(tenant);
  }

  async findAll(): Promise<TenantResponseDto[]> {
    // Try to get from cache first
    const cached = await this.cacheService.get<TenantResponseDto[]>(
      this.cacheService.getTenantListKey(),
    );

    if (cached) {
      return cached;
    }

    const tenants = await this.tenantRepository.find();
    const response = tenants.map((tenant) => this.formatResponse(tenant));

    // Cache the tenant list
    await this.cacheService.set(
      this.cacheService.getTenantListKey(),
      response,
      300, // 5 minutes TTL
    );

    return response;
  }

  async update(
    id: string,
    payload: UpdateTenantPayload,
  ): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException({
        code: TenantErrorCode.TENANT_NOT_FOUND,
        message: `Tenant with ID '${id}' not found`,
      });
    }

    // Check if new slug already exists (if slug is being updated)
    if (payload.slug && payload.slug !== tenant.slug) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { slug: payload.slug },
      });

      if (existingTenant) {
        throw new BadRequestException({
          code: TenantErrorCode.DUPLICATE_SLUG,
          message: `Tenant with slug '${payload.slug}' already exists`,
        });
      }
    }

    Object.assign(tenant, payload);
    const updated = await this.tenantRepository.save(tenant);

    // Invalidate caches
    await this.cacheService.invalidateTenant(updated.id);

    // Publish tenant updated event
    this.eventPublisher.publishTenantUpdated({
      tenantId: updated.id,
      name: updated.name,
      slug: updated.slug,
      updatedAt: updated.updatedAt,
    });

    return this.formatResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException({
        code: TenantErrorCode.TENANT_NOT_FOUND,
        message: `Tenant with ID '${id}' not found`,
      });
    }

    await this.tenantRepository.remove(tenant);

    // Invalidate caches
    await this.cacheService.invalidateTenant(id);

    // Publish tenant deleted event
    this.eventPublisher.publishTenantDeleted({
      tenantId: tenant.id,
      deletedAt: new Date(),
    });
  }

  private formatResponse(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      status: tenant.status as unknown as TenantStatus,
      website: tenant.website,
      logo: tenant.logo,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}

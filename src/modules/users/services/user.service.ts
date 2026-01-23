import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/entities/user.entity';
import { Tenant } from '../../../database/entities/tenant.entity';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserResponseDto,
} from '../interfaces';
import { UserErrorCode, UserStatus } from '../enums';
import { EventPublisherService } from '../../../common/services';
import { CacheService } from '../../redis/cache.service';
import { UserCreatedEvent } from '../../../common/events/events';

@Injectable()
export class UserService {
  private readonly cacheTtlUser: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlUser = this.configService.get<number>('CACHE_TTL_USER', 300);
  }

  async create(
    tenantId: string,
    payload: CreateUserPayload,
  ): Promise<UserResponseDto> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException({
        code: UserErrorCode.TENANT_NOT_FOUND,
        message: `Tenant with ID '${tenantId}' not found`,
      });
    }

    // Check if email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: {
        email: payload.email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException({
        code: UserErrorCode.EMAIL_ALREADY_EXISTS,
        message: `User with email '${payload.email}' already exists in this tenant`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = this.userRepository.create({
      email: payload.email,
      name: payload.name,
      passwordHash: hashedPassword,
      tenantId,
      status: UserStatus.ACTIVE,
    });

    const saved = await this.userRepository.save(user);

    // Cache the newly created user
    await this.cacheService.set(
      this.cacheService.getUserKey(saved.id),
      this.formatResponse(saved),
      this.cacheTtlUser,
    );

    // Invalidate user list cache for tenant
    await this.cacheService.del(this.cacheService.getUserListKey(tenantId));

    // Publish user created event with fire-and-forget pattern
    try {
      const userCreatedPayload: UserCreatedEvent = {
        userId: saved.id,
        email: saved.email,
        name: saved.name,
        tenantId: saved.tenantId,
        createdAt: saved.createdAt,
      };
      this.eventPublisher.publishUserCreated(userCreatedPayload);
    } catch (error) {
      // Log but don't fail the request if event publishing fails
      console.error('Failed to publish user created event:', error);
    }

    return this.formatResponse(saved);
  }

  async findById(tenantId: string, userId: string): Promise<UserResponseDto> {
    // Try to get from cache first
    const cached = await this.cacheService.get<UserResponseDto>(
      this.cacheService.getUserKey(userId),
    );

    // Validate cached data belongs to correct tenant
    if (cached && cached.tenantId === tenantId) {
      return cached;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: `User with ID '${userId}' not found`,
      });
    }

    const response = this.formatResponse(user);

    // Cache the user
    await this.cacheService.set(
      this.cacheService.getUserKey(userId),
      response,
      this.cacheTtlUser,
    );

    return response;
  }

  async findByEmail(tenantId: string, email: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: `User with email '${email}' not found`,
      });
    }

    return this.formatResponse(user);
  }

  async findAllByTenant(tenantId: string): Promise<UserResponseDto[]> {
    // Try to get from cache first
    const cached = await this.cacheService.get<UserResponseDto[]>(
      this.cacheService.getUserListKey(tenantId),
    );

    if (cached) {
      return cached;
    }

    const users = await this.userRepository.find({
      where: { tenantId },
    });

    const response = users.map((user) => this.formatResponse(user));

    // Cache the user list
    await this.cacheService.set(
      this.cacheService.getUserListKey(tenantId),
      response,
      this.cacheTtlUser,
    );

    return response;
  }

  async update(
    tenantId: string,
    userId: string,
    payload: UpdateUserPayload,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: `User with ID '${userId}' not found`,
      });
    }

    // Explicitly set properties instead of Object.assign
    if (payload.name !== undefined) {
      user.name = payload.name;
    }
    if (payload.status !== undefined) {
      user.status = payload.status;
    }

    const updated = await this.userRepository.save(user);

    // Invalidate user caches
    await this.cacheService.invalidateUser(updated.id, tenantId);

    // Publish user updated event with fire-and-forget pattern
    try {
      this.eventPublisher.publishUserUpdated({
        userId: updated.id,
        tenantId: updated.tenantId,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      // Log but don't fail the request
      console.error('Failed to publish user updated event:', error);
    }

    return this.formatResponse(updated);
  }

  async delete(tenantId: string, userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException({
        code: UserErrorCode.USER_NOT_FOUND,
        message: `User with ID '${userId}' not found`,
      });
    }

    // Publish user deleted event before removing (transactional consistency)
    try {
      this.eventPublisher.publishUserDeleted({
        userId: user.id,
        tenantId: user.tenantId,
        deletedAt: new Date(),
      });
    } catch (error) {
      // Log but continue with deletion
      console.error('Failed to publish user deleted event:', error);
    }

    // Invalidate user caches after event published
    await this.cacheService.invalidateUser(userId, user.tenantId);

    // Finally remove the user
    await this.userRepository.remove(user);
  }

  private formatResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

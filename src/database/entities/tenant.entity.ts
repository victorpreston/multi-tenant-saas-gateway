import { Entity, Column, OneToMany, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';
import { ApiKey } from './api-key.entity';
import { AuditLog } from './audit-log.entity';
import type { TenantMetadata, TenantSubscription } from '../types/index';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Tenant entity - Represents a customer in the SaaS platform
 * Core to multi-tenancy: all data is scoped to a tenant
 */
@Entity('tenants')
@Index(['slug'])
@Index(['status'])
@Unique(['slug'])
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: TenantMetadata;

  @Column({
    type: 'jsonb',
    default: { plan: 'free', maxUsers: 10, maxApiKeys: 5 },
  })
  subscription: TenantSubscription;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.tenant)
  apiKeys: ApiKey[];

  @OneToMany(() => AuditLog, 'tenant')
  auditLogs!: AuditLog[];
}

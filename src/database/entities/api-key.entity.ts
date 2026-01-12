import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import type { ApiKeyMetadata } from '../types/index';

export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * ApiKey entity - Service-to-service authentication
 * Each tenant can have multiple API keys for programmatic access
 */
@Entity('api_keys')
@Index(['tenantId'])
@Index(['key'])
@Unique(['tenantId', 'name'])
@Unique(['key'])
export class ApiKey extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'text' })
  secret: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'simple-array', default: [] })
  scopes: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: ApiKeyMetadata;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}

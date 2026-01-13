import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import type { AuditLogChanges, AuditLogMetadata } from '../types/index';

/**
 * AuditLog entity - Compliance and audit trail
 * Immutable record of all important system events
 */
@Entity('audit_logs')
@Index(['tenantId'])
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', default: {} })
  changes: AuditLogChanges;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: AuditLogMetadata;

  // Relations
  @ManyToOne(
    () => Tenant,
    (tenant: Tenant): AuditLog[] | undefined => tenant.auditLogs,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}

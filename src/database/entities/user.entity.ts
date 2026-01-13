import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { Role } from './role.entity';
import type { UserMetadata } from '../types/index';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

/**
 * User entity - Represents a user within a tenant
 * Always scoped to a tenant via tenantId
 */
@Entity('users')
@Index(['tenantId'])
@Index(['email'])
@Index(['tenantId', 'email'])
@Unique(['tenantId', 'email'])
export class User extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: UserMetadata;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => Role, (role) => role.owner, { nullable: true })
  roles: Role[];
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Permission } from './permission.entity';
import type { RoleMetadata } from '../types/index';

/**
 * Role entity - RBAC for multi-tenant system
 * Each role is scoped to a tenant
 */
@Entity('roles')
@Index(['tenantId'])
@Index(['tenantId', 'name'])
export class Role extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: RoleMetadata;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, (user) => user.roles, { nullable: true })
  owner: User;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}

import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

/**
 * Permission entity - Granular actions within the system
 * Used for fine-grained RBAC
 */
@Entity('permissions')
@Index(['resource'])
@Index(['action'])
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}

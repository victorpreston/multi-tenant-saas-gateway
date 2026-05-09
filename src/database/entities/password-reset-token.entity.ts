import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('password_reset_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['expiresAt'])
export class PasswordResetToken extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

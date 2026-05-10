import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/entities/user.entity';
import { PasswordResetToken } from '../../../database/entities/password-reset-token.entity';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_TTL_MINUTES = 60;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
  ) {}

  async requestReset(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    await this.tokenRepository.update(
      { userId: user.id, used: false },
      { used: true },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_TTL_MINUTES * 60 * 1000);

    await this.tokenRepository.save(
      this.tokenRepository.create({
        userId: user.id,
        tenantId: dto.tenantId,
        token: hashed,
        expiresAt,
        used: false,
      }),
    );

    this.logger.log(
      `Password reset token generated for user ${user.id} (simulate email delivery)`,
    );

    return {
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashed = crypto.createHash('sha256').update(dto.token).digest('hex');

    const record = await this.tokenRepository.findOne({
      where: {
        token: hashed,
        tenantId: dto.tenantId,
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    record.user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(record.user);

    record.used = true;
    await this.tokenRepository.save(record);
  }
}

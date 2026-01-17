import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { LoginDto } from '../dto';
import { AuthErrorCode } from '../enums';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(dto: LoginDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        tenantId: dto.tenantId,
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        `Invalid credentials: ${AuthErrorCode.INVALID_CREDENTIALS}`,
      );
    }

    const isPasswordValid = await this.comparePasswords(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        `Invalid credentials: ${AuthErrorCode.INVALID_CREDENTIALS}`,
      );
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.PENDING
    ) {
      throw new UnauthorizedException(
        `User inactive: ${AuthErrorCode.USER_INACTIVE}`,
      );
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return user;
  }

  private async comparePasswords(
    plainPassword: string,
    hash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }
}

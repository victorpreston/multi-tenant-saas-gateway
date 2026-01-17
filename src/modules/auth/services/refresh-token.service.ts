import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../database/entities/user.entity';
import { RefreshTokenDto } from '../dto';
import { JwtPayload } from '../interfaces';
import { AuthErrorCode } from '../enums';
import type { EnvironmentVariables } from '../../../config/validation';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<User> {
    let payload: JwtPayload;

    try {
      const refreshSecret = this.configService.get(
        'JWT_REFRESH_SECRET',
      ) as string;
      if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET not configured');
      }

      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        `Invalid token: ${AuthErrorCode.INVALID_TOKEN}`,
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        tenantId: dto.tenantId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        `User not found: ${AuthErrorCode.USER_NOT_FOUND}`,
      );
    }

    return user;
  }
}

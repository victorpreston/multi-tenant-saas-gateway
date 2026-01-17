import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../database/entities/user.entity';
import { TokenResponseDto } from '../dto';
import { JwtPayload } from '../interfaces';
import type { EnvironmentVariables } from '../../../config/validation';

@Injectable()
export class TokenGeneratorService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  generate(user: User): TokenResponseDto {
    const jwtExpiration = this.getConfigString('JWT_EXPIRATION', '24h');
    const refreshExpiration = this.getConfigString(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const accessExpiresInHours = this.extractHours(jwtExpiration);

    return {
      accessToken: this.generateAccessToken(
        user.id,
        user.email,
        user.tenantId,
        jwtExpiration,
      ),
      refreshToken: this.generateRefreshToken(
        user.id,
        user.email,
        user.tenantId,
        refreshExpiration,
      ),
      expiresIn: accessExpiresInHours,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        status: user.status,
      },
    };
  }

  private generateAccessToken(
    userId: string,
    email: string,
    tenantId: string,
    expiresIn: string,
  ): string {
    const jwtSecret = this.getRequiredConfigString('JWT_SECRET');

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      tenantId,
    };

    return this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn,
    } as JwtSignOptions);
  }

  private generateRefreshToken(
    userId: string,
    email: string,
    tenantId: string,
    expiresIn: string,
  ): string {
    const refreshSecret = this.getRequiredConfigString('JWT_REFRESH_SECRET');

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      tenantId,
    };

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn,
    } as JwtSignOptions);
  }

  private extractHours(expirationStr: string): number {
    const match = expirationStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 24;
  }

  private getConfigString<K extends string>(
    key: K & keyof EnvironmentVariables,
    defaultValue: string,
  ): string {
    const value = this.configService.get<string | undefined>(key);
    return String(value ?? defaultValue);
  }

  private getRequiredConfigString<K extends string>(
    key: K & keyof EnvironmentVariables,
  ): string {
    const value = this.configService.get<string | undefined>(key);
    if (!value) {
      throw new Error(`Required configuration key not set: ${key}`);
    }
    return value;
  }
}

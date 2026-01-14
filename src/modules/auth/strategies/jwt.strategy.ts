import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvironmentVariables } from '../../../config/validation';

/**
 * JWT Strategy for Passport
 * Extracts and validates JWT tokens from Authorization headers
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<EnvironmentVariables>) {
    const jwtSecret = (configService.get('JWT_SECRET') as string) || '';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validate JWT payload and extract user data
   * Called automatically when JWT is verified
   */
  validate(payload: {
    sub: string;
    email: string;
    tenantId: string;
    iat: number;
    exp: number;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    };
  }
}

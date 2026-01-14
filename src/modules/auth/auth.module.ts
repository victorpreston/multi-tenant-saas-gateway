import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User, Tenant } from '../../database/entities';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies';
import {
  RegisterService,
  LoginService,
  RefreshTokenService,
  TokenGeneratorService,
} from './services';
import type { EnvironmentVariables } from '../../config/validation';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterService,
    LoginService,
    RefreshTokenService,
    TokenGeneratorService,
    JwtStrategy,
  ],
  exports: [
    RegisterService,
    LoginService,
    RefreshTokenService,
    TokenGeneratorService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ApiKey } from '../../database/entities';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyStrategy } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyStrategy],
  exports: [ApiKeysService, ApiKeyStrategy],
})
export class ApiKeysModule {}

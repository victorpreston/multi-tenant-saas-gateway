import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { TenantService } from './services';
import { TenantController } from './tenants.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    KafkaModule,
    RedisModule,
    AuditModule,
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantsModule {}

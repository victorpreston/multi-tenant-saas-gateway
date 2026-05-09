import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { TenantService } from './services';
import { OnboardingService } from './services/onboarding.service';
import { TenantController } from './tenants.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Role, Permission]),
    KafkaModule,
    RedisModule,
    AuditModule,
  ],
  providers: [TenantService, OnboardingService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantsModule {}

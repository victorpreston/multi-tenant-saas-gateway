import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditController } from './audit.controller';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), RbacModule],
  providers: [AuditService, AuditInterceptor],
  controllers: [AuditController],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { RbacService } from './rbac.service';
import { RbacGuard } from './rbac.guard';
import { RbacController } from './rbac.controller';
import { RedisModule } from '../redis';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission]), RedisModule],
  providers: [RbacService, RbacGuard],
  controllers: [RbacController],
  exports: [RbacService, RbacGuard],
})
export class RbacModule {}

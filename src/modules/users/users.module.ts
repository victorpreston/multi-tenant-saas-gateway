import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { UserService } from './services';
import { UserController } from './users.controller';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
    KafkaModule,
    RedisModule,
    AuditModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UsersModule {}

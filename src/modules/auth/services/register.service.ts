import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { Tenant } from '../../../database/entities/tenant.entity';
import { RegisterDto } from '../dto';
import { AuthErrorCode } from '../enums';

@Injectable()
export class RegisterService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException(
        `Tenant not found: ${AuthErrorCode.TENANT_NOT_FOUND}`,
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: {
        tenantId: dto.tenantId,
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        `Email already exists: ${AuthErrorCode.EMAIL_EXISTS}`,
      );
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = this.userRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      name: dto.name,
      passwordHash,
      status: UserStatus.PENDING,
      emailVerified: false,
    });

    return await this.userRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }
}

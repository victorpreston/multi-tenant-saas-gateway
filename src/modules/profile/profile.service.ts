import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import type { UpdateProfileDto, ProfileResponseDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile(
    userId: string,
    tenantId: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.format(user);
  }

  async updateProfile(
    userId: string,
    tenantId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.name !== undefined) user.name = dto.name;
    const saved = await this.userRepository.save(user);
    return this.format(saved);
  }

  private format(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

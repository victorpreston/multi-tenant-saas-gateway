import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UserService } from './services';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserResponseDto } from './interfaces';
import type { TenantRequest } from '../../middleware/tenant.middleware';

@Controller('users')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  private getTenantId(req: TenantRequest): string {
    if (!req.tenantId) {
      throw new BadRequestException(
        'Tenant ID is missing from request context',
      );
    }
    return req.tenantId;
  }

  @Post()
  async create(
    @Request() req: TenantRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.create(tenantId, createUserDto);
  }

  @Get()
  async findAll(@Request() req: TenantRequest): Promise<UserResponseDto[]> {
    const tenantId = this.getTenantId(req);
    return this.userService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findById(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.findById(tenantId, userId);
  }

  @Put(':id')
  async update(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.update(tenantId, userId, updateUserDto);
  }

  @Delete(':id')
  async delete(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
  ): Promise<{ message: string }> {
    const tenantId = this.getTenantId(req);
    await this.userService.delete(tenantId, userId);
    return { message: 'User deleted successfully' };
  }
}

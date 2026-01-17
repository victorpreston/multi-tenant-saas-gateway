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

  @Post()
  async create(
    @Request() req: TenantRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = req.tenantId!;
    return this.userService.create(tenantId, createUserDto);
  }

  @Get()
  async findAll(@Request() req: TenantRequest): Promise<UserResponseDto[]> {
    const tenantId = req.tenantId!;
    return this.userService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findById(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
  ): Promise<UserResponseDto> {
    const tenantId = req.tenantId!;
    return this.userService.findById(tenantId, userId);
  }

  @Put(':id')
  async update(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = req.tenantId!;
    return this.userService.update(tenantId, userId, updateUserDto);
  }

  @Delete(':id')
  async delete(
    @Request() req: TenantRequest,
    @Param('id') userId: string,
  ): Promise<{ message: string }> {
    const tenantId = req.tenantId!;
    await this.userService.delete(tenantId, userId);
    return { message: 'User deleted successfully' };
  }
}

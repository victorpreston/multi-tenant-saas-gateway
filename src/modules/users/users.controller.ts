import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
  BadRequestException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UserService } from './services';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserResponseDto } from './interfaces';
import type { TenantRequest } from '../../middleware/tenant.middleware';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtGuard)
@UseInterceptors(AuditInterceptor)
@Controller('users')
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
  @ApiOperation({ summary: 'Create a user in the current tenant' })
  @Audit('user.create', 'users')
  async create(
    @Request() req: TenantRequest,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.create(tenantId, createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users in the current tenant' })
  async findAll(@Request() req: TenantRequest): Promise<UserResponseDto[]> {
    const tenantId = this.getTenantId(req);
    return this.userService.findAllByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findById(
    @Request() req: TenantRequest,
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.findById(tenantId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Audit('user.update', 'users')
  async update(
    @Request() req: TenantRequest,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const tenantId = this.getTenantId(req);
    return this.userService.update(tenantId, userId, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('user.delete', 'users')
  async delete(
    @Request() req: TenantRequest,
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    const tenantId = this.getTenantId(req);
    await this.userService.delete(tenantId, userId);
  }
}

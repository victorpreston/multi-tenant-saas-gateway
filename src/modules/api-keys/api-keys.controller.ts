import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  UseGuards,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import type { CurrentUserData } from '../../common/decorators';
import { JwtGuard } from '../auth/guards';
import { ApiKeysService } from './api-keys.service';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyResponseDto,
  ApiKeyWithSecretResponseDto,
} from './dto';

@Controller('api-keys')
@UseGuards(JwtGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  /**
   * Create a new API key for the current tenant
   */
  @Post()
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createDto: CreateApiKeyDto,
  ): Promise<ApiKeyWithSecretResponseDto> {
    return this.apiKeysService.create(user.tenantId, createDto);
  }

  /**
   * Get all API keys for the current tenant
   */
  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.findAll(user.tenantId);
  }

  /**
   * Get a specific API key by ID
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.findOne(user.tenantId, id);
  }

  /**
   * Update an API key (name, scopes, expiry)
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() updateDto: UpdateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.update(user.tenantId, id, updateDto);
  }

  /**
   * Rotate API key secret (generates new secret)
   */
  @Post(':id/rotate')
  async rotate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<ApiKeyWithSecretResponseDto> {
    return this.apiKeysService.rotate(user.tenantId, id);
  }

  /**
   * Revoke an API key (status = REVOKED)
   */
  @Post(':id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<void> {
    return this.apiKeysService.revoke(user.tenantId, id);
  }

  /**
   * Delete an API key permanently
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<void> {
    return this.apiKeysService.delete(user.tenantId, id);
  }
}

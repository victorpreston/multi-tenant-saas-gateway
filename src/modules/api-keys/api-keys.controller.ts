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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('api-keys')
@ApiBearerAuth('JWT')
@Controller('api-keys')
@UseGuards(JwtGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key for the current tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ApiKeyWithSecretResponseDto,
  })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() createDto: CreateApiKeyDto,
  ): Promise<ApiKeyWithSecretResponseDto> {
    return this.apiKeysService.create(user.tenantId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys for the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: [ApiKeyResponseDto] })
  async findAll(
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific API key by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: ApiKeyResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'API key not found',
  })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an API key (name, scopes, expiry)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: ApiKeyResponseDto })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.update(user.tenantId, id, updateDto);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate API key — generates a new secret' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: ApiKeyWithSecretResponseDto })
  async rotate(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiKeyWithSecretResponseDto> {
    return this.apiKeysService.rotate(user.tenantId, id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.apiKeysService.revoke(user.tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete an API key' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.apiKeysService.delete(user.tenantId, id);
  }
}

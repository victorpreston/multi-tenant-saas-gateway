import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards';
import { CurrentUser } from '../../common/decorators';
import type { CurrentUserData } from '../../common/decorators';
import { WebhookService } from './webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookTestDto,
  RotateWebhookSecretResponseDto,
} from './dto/webhook.dto';

@ApiTags('webhooks')
@ApiBearerAuth('JWT')
@UseGuards(JwtGuard)
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook endpoint' })
  @ApiResponse({ status: HttpStatus.CREATED, type: WebhookResponseDto })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhooks for the current tenant' })
  @ApiResponse({ status: HttpStatus.OK, type: [WebhookResponseDto] })
  async findAll(
    @CurrentUser() user: CurrentUserData,
  ): Promise<WebhookResponseDto[]> {
    return this.webhookService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: WebhookResponseDto })
  async findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook (url, events, active status)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: WebhookResponseDto })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.webhookService.delete(user.tenantId, id);
  }

  @Post(':id/rotate-secret')
  @ApiOperation({ summary: 'Rotate the signing secret for a webhook' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, type: RotateWebhookSecretResponseDto })
  async rotateSecret(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ secret: string }> {
    return this.webhookService.rotateSecret(user.tenantId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test delivery to the webhook endpoint' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async testDelivery(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WebhookTestDto,
  ): Promise<{ delivered: boolean }> {
    return this.webhookService.testDelivery(user.tenantId, id, dto.event);
  }
}

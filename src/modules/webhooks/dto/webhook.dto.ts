import {
  IsString,
  IsUrl,
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '../../../database/entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/webhooks/saas' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiPropertyOptional({ example: 'Notify my backend on user events' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    enum: WebhookEvent,
    isArray: true,
    example: [WebhookEvent.USER_CREATED],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRetries?: number;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'https://example.com/webhooks/v2' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: WebhookEvent, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events?: WebhookEvent[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRetries?: number;
}

export class WebhookResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() url: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: WebhookEvent, isArray: true }) events: WebhookEvent[];
  @ApiProperty() isActive: boolean;
  @ApiProperty() maxRetries: number;
  @ApiProperty() deliveryCount: number;
  @ApiProperty() failureCount: number;
  @ApiPropertyOptional() lastDeliveredAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class WebhookTestDto {
  @ApiProperty({ enum: WebhookEvent, example: WebhookEvent.USER_CREATED })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;
}

export class RotateWebhookSecretResponseDto {
  @ApiProperty() secret: string;
}

export class TriggerWebhookDto {
  @ApiProperty({ enum: WebhookEvent })
  @IsEnum(WebhookEvent)
  @IsString()
  @MinLength(1)
  event: WebhookEvent;

  @ApiProperty({ type: Object })
  payload: Record<string, unknown>;
}

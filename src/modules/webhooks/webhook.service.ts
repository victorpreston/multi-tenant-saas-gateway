import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Webhook, WebhookEvent } from '../../database/entities/webhook.entity';
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
} from './dto/webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const secret = this.generateSecret();
    const webhook = this.webhookRepository.create({
      tenantId,
      url: dto.url,
      description: dto.description,
      events: dto.events,
      secret,
      maxRetries: dto.maxRetries ?? 3,
      isActive: true,
      deliveryCount: 0,
      failureCount: 0,
    });
    const saved = await this.webhookRepository.save(webhook);
    return this.formatResponse(saved);
  }

  async findAll(tenantId: string): Promise<WebhookResponseDto[]> {
    const webhooks = await this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return webhooks.map((w) => this.formatResponse(w));
  }

  async findOne(tenantId: string, id: string): Promise<WebhookResponseDto> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID '${id}' not found`);
    }
    return this.formatResponse(webhook);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID '${id}' not found`);
    }
    Object.assign(webhook, dto);
    const updated = await this.webhookRepository.save(webhook);
    return this.formatResponse(updated);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID '${id}' not found`);
    }
    await this.webhookRepository.remove(webhook);
  }

  async rotateSecret(
    tenantId: string,
    id: string,
  ): Promise<{ secret: string }> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID '${id}' not found`);
    }
    webhook.secret = this.generateSecret();
    await this.webhookRepository.save(webhook);
    return { secret: webhook.secret };
  }

  async trigger(
    tenantId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { tenantId, isActive: true },
    });

    const matching = webhooks.filter((w) => w.events.includes(event));
    await Promise.allSettled(
      matching.map((webhook) => this.deliver(webhook, event, payload)),
    );
  }

  async testDelivery(
    tenantId: string,
    id: string,
    event: WebhookEvent,
  ): Promise<{ delivered: boolean; statusCode?: number }> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID '${id}' not found`);
    }
    const testPayload = {
      test: true,
      event,
      timestamp: new Date().toISOString(),
    };
    try {
      await this.deliver(webhook, event, testPayload);
      return { delivered: true };
    } catch {
      return { delivered: false };
    }
  }

  private async deliver(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
    const signature = this.sign(body, webhook.secret);

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < webhook.maxRetries) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': signature,
            'x-webhook-event': event,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          throw new BadRequestException(`Webhook returned ${response.status}`);
        }

        webhook.deliveryCount += 1;
        webhook.lastDeliveredAt = new Date();
        await this.webhookRepository.save(webhook);
        return;
      } catch (err) {
        attempt++;
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `Webhook delivery attempt ${attempt}/${webhook.maxRetries} failed for ${webhook.url}: ${lastError.message}`,
        );
      }
    }

    webhook.failureCount += 1;
    await this.webhookRepository.save(webhook);
    if (lastError) throw lastError;
  }

  verifySignature(
    rawBody: string,
    secret: string,
    receivedSig: string,
  ): boolean {
    const expected = this.sign(rawBody, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(receivedSig),
    );
  }

  private sign(body: string, secret: string): string {
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  private formatResponse(webhook: Webhook): WebhookResponseDto {
    return {
      id: webhook.id,
      tenantId: webhook.tenantId,
      url: webhook.url,
      description: webhook.description,
      events: webhook.events,
      isActive: webhook.isActive,
      maxRetries: webhook.maxRetries,
      deliveryCount: webhook.deliveryCount,
      failureCount: webhook.failureCount,
      lastDeliveredAt: webhook.lastDeliveredAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }
}

import { createHmac } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { Webhook, WebhookEvent } from '../../database/entities/webhook.entity';

const makeWebhook = (overrides: Partial<Webhook> = {}): Webhook =>
  ({
    id: 'webhook-id',
    tenantId: 'tenant-id',
    url: 'https://example.com/webhook',
    description: 'Test webhook',
    events: [WebhookEvent.USER_CREATED],
    secret: 'whsec_abc123',
    isActive: true,
    maxRetries: 3,
    deliveryCount: 0,
    failureCount: 0,
    lastDeliveredAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Webhook;

describe('WebhookService', () => {
  let service: WebhookService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: getRepositoryToken(Webhook), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(WebhookService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a webhook with a generated secret', async () => {
      const dto = {
        url: 'https://example.com/hook',
        events: [WebhookEvent.USER_CREATED],
      };
      const webhook = makeWebhook({ url: dto.url });
      mockRepo.create.mockReturnValue(webhook);
      mockRepo.save.mockResolvedValue(webhook);

      const result = await service.create('tenant-id', dto);
      expect(result.url).toBe(dto.url);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-id', url: dto.url }),
      );
    });
  });

  describe('findAll', () => {
    it('returns all webhooks for a tenant', async () => {
      mockRepo.find.mockResolvedValue([makeWebhook()]);
      const result = await service.findAll('tenant-id');
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe('tenant-id');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when webhook does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('tenant-id', 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the webhook when found', async () => {
      mockRepo.findOne.mockResolvedValue(makeWebhook());
      const result = await service.findOne('tenant-id', 'webhook-id');
      expect(result.id).toBe('webhook-id');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when webhook does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('tenant-id', 'missing-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates and returns the webhook', async () => {
      const webhook = makeWebhook();
      mockRepo.findOne.mockResolvedValue(webhook);
      mockRepo.save.mockResolvedValue({ ...webhook, isActive: false });

      const result = await service.update('tenant-id', 'webhook-id', {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when webhook does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('tenant-id', 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes the webhook', async () => {
      const webhook = makeWebhook();
      mockRepo.findOne.mockResolvedValue(webhook);
      mockRepo.remove.mockResolvedValue(webhook);

      await service.delete('tenant-id', 'webhook-id');
      expect(mockRepo.remove).toHaveBeenCalledWith(webhook);
    });
  });

  describe('rotateSecret', () => {
    it('throws NotFoundException when webhook does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.rotateSecret('tenant-id', 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('generates and saves a new secret', async () => {
      const webhook = makeWebhook();
      mockRepo.findOne.mockResolvedValue(webhook);
      mockRepo.save.mockResolvedValue(webhook);

      const result = await service.rotateSecret('tenant-id', 'webhook-id');
      expect(result.secret).toBeDefined();
      expect(result.secret).toMatch(/^whsec_/);
      expect(result.secret).not.toBe('whsec_abc123');
    });
  });

  describe('verifySignature', () => {
    it('returns true for a valid signature', () => {
      const body = JSON.stringify({ event: 'user.created' });
      const secret = 'mysecret';
      const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
      expect(service.verifySignature(body, secret, expected)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      const body = JSON.stringify({ event: 'user.created' });
      const secret = 'mysecret';
      const realHex = createHmac('sha256', secret).update(body).digest('hex');
      const wrong = `sha256=${'0'.repeat(realHex.length)}`;
      expect(service.verifySignature(body, secret, wrong)).toBe(false);
    });
  });
});

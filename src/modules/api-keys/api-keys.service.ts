import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHmac } from 'crypto';
import { ApiKey, ApiKeyStatus } from '../../database/entities';
import {
  CreateApiKeyDto,
  UpdateApiKeyDto,
  ApiKeyWithSecretResponseDto,
} from './dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Generate a new API key for a tenant
   */
  async create(
    tenantId: string,
    createDto: CreateApiKeyDto,
  ): Promise<ApiKeyWithSecretResponseDto> {
    // Check if tenant already has max keys
    const existingKeys = await this.apiKeyRepository.count({
      where: { tenantId, status: ApiKeyStatus.ACTIVE },
    });

    // Limit to 10 active keys per tenant (configurable)
    if (existingKeys >= 10) {
      throw new BadRequestException(
        'Maximum number of active API keys reached for this tenant',
      );
    }

    // Generate unique key and secret
    const { key, secret, hashedSecret } = this.generateKeyAndSecret();

    // Check for uniqueness (should be extremely rare but check anyway)
    const existingKey = await this.apiKeyRepository.findOne({
      where: { key },
    });

    if (existingKey) {
      throw new BadRequestException('API key already exists, please try again');
    }

    // Create the API key
    const apiKey = this.apiKeyRepository.create();
    apiKey.tenantId = tenantId;
    apiKey.name = createDto.name;
    apiKey.key = key;
    apiKey.secret = hashedSecret;
    apiKey.status = ApiKeyStatus.ACTIVE;
    apiKey.scopes = createDto.scopes || [];
    if (createDto.expiresAt) {
      apiKey.expiresAt = new Date(createDto.expiresAt);
    }
    apiKey.metadata = {};

    const saved = await this.apiKeyRepository.save(apiKey);

    // Return with un-hashed secret (only shown once)
    return this.mapToResponseDto(saved, secret);
  }

  /**
   * Get all API keys for a tenant
   */
  async findAll(tenantId: string): Promise<ApiKeyWithSecretResponseDto[]> {
    const keys = await this.apiKeyRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return keys.map((key) => this.mapToResponseDto(key));
  }

  /**
   * Get a specific API key
   */
  async findOne(
    tenantId: string,
    keyId: string,
  ): Promise<ApiKeyWithSecretResponseDto> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.mapToResponseDto(key);
  }

  /**
   * Update an API key (name, scopes, expiry)
   */
  async update(
    tenantId: string,
    keyId: string,
    updateDto: UpdateApiKeyDto,
  ): Promise<ApiKeyWithSecretResponseDto> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    // Update fields
    if (updateDto.name) {
      key.name = updateDto.name;
    }
    if (updateDto.scopes) {
      key.scopes = updateDto.scopes;
    }
    if (updateDto.expiresAt) {
      key.expiresAt = new Date(updateDto.expiresAt);
    }
    // Note: description is no longer stored in metadata since ApiKeyMetadata doesn't support it
    // You could extend ApiKeyMetadata type if needed

    const updated = await this.apiKeyRepository.save(key);
    return this.mapToResponseDto(updated);
  }

  /**
   * Revoke an API key
   */
  async revoke(tenantId: string, keyId: string): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    key.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepository.save(key);
  }

  /**
   * Delete an API key
   */
  async delete(tenantId: string, keyId: string): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.remove(key);
  }

  /**
   * Rotate an API key - generates new secret, keeps same key
   */
  async rotate(
    tenantId: string,
    keyId: string,
  ): Promise<ApiKeyWithSecretResponseDto> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    const { secret, hashedSecret } = this.generateKeyAndSecret();
    key.secret = hashedSecret;

    const updated = await this.apiKeyRepository.save(key);
    return this.mapToResponseDto(updated, secret);
  }

  /**
   * Validate API key - for authentication
   * Called by ApiKeyStrategy during Passport authentication
   */
  async validateApiKey(key: string, secret: string): Promise<ApiKey | null> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key },
      relations: ['tenant'],
    });

    if (!apiKey) {
      return null;
    }

    // Check if active
    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = ApiKeyStatus.EXPIRED;
      await this.apiKeyRepository.save(apiKey);
      return null;
    }

    // Verify secret matches
    const hashedProvided = this.hashSecret(secret);
    if (hashedProvided !== apiKey.secret) {
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepository.save(apiKey);

    return apiKey;
  }

  /**
   * Generate API key and secret
   */
  private generateKeyAndSecret(): {
    key: string;
    secret: string;
    hashedSecret: string;
  } {
    // Key format: sk_live_<random> or sk_test_<random>
    const prefix = 'sk_';
    const randomPart = randomBytes(24).toString('hex');
    const key = `${prefix}${randomPart}`;

    // Secret is longer random bytes
    const secret = randomBytes(32).toString('hex');
    const hashedSecret = this.hashSecret(secret);

    return { key, secret, hashedSecret };
  }

  /**
   * Hash secret using HMAC-SHA256
   */
  private hashSecret(secret: string): string {
    return createHmac('sha256', 'api-key-salt').update(secret).digest('hex');
  }

  /**
   * Map API key entity to response DTO
   */
  private mapToResponseDto(
    apiKey: ApiKey,
    plainSecret?: string,
  ): ApiKeyWithSecretResponseDto {
    const dto = new ApiKeyWithSecretResponseDto();
    dto.id = apiKey.id;
    dto.tenantId = apiKey.tenantId;
    dto.name = apiKey.name;
    dto.key = apiKey.key;
    dto.secret = plainSecret || ''; // Only include if just generated
    dto.status = apiKey.status;
    dto.scopes = apiKey.scopes;
    dto.expiresAt = apiKey.expiresAt || null;
    dto.lastUsedAt = apiKey.lastUsedAt || null;
    dto.createdAt = apiKey.createdAt;
    dto.updatedAt = apiKey.updatedAt;
    return dto;
  }
}

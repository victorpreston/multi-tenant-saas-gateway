import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';

/**
 * Custom API Key Strategy for Passport
 * Extracts API key and secret from X-API-Key and X-API-Secret headers
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  /**
   * Validate API key credentials
   */
  async validate(req: Request): Promise<any> {
    const apiKey = req.headers['x-api-key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string;

    if (!apiKey || !apiSecret) {
      throw new UnauthorizedException(
        'Missing X-API-Key or X-API-Secret header',
      );
    }

    // Validate against database
    const keyRecord = await this.apiKeysService.validateApiKey(
      apiKey,
      apiSecret,
    );

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key or secret');
    }

    // Attach to request context similar to JWT
    return {
      userId: keyRecord.id,
      tenantId: keyRecord.tenantId,
      apiKeyId: keyRecord.id,
      scopes: keyRecord.scopes,
      isApiKeyAuth: true,
    };
  }
}

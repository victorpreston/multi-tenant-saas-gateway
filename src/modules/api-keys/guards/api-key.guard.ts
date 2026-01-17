import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * API Key Guard
 * Use @UseGuards(ApiKeyGuard) to protect routes
 * Automatically validates API key and secret from X-API-Key and X-API-Secret headers
 * Attaches authentication info to request.user if valid
 */
@Injectable()
export class ApiKeyGuard extends AuthGuard('api-key') {}

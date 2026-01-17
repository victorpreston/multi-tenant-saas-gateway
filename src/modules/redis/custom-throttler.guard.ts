/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttler guard that uses tenant ID + user ID for rate limiting tracking.
 */
@Injectable()
export class TenantAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const tenantId = req['tenantId'] || 'anonymous';
    const userId = req.user?.id || req.ip;
    return `${tenantId}:${userId}`;
  }
}

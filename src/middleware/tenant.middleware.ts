import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, res: Response, next: NextFunction) {
    // Extract tenant ID from header (e.g., X-Tenant-ID)
    const tenantIdFromHeader = req.get('X-Tenant-ID');

    // Extract tenant from subdomain (e.g., tenant-slug.example.com)
    const subdomain = this.extractSubdomain(req);

    // Prefer header value, fallback to subdomain
    const tenantId = tenantIdFromHeader || subdomain;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant ID is required. Provide X-Tenant-ID header or use tenant subdomain.',
      );
    }

    // Attach tenant ID to request for use in controllers/services
    req.tenantId = tenantId;

    // Extracting and attaching
    // the tenant identifier.
    next();
  }

  private extractSubdomain(req: Request): string | undefined {
    const host = req.get('host') || '';
    const parts = host.split('.');

    // Only extract subdomain if there are at least 3 parts (subdomain.domain.ext)
    if (parts.length >= 3) {
      return parts[0];
    }

    return undefined;
  }
}

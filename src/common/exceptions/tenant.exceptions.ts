import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class TenantNotFoundException extends AppException {
  constructor(identifier: string) {
    super(
      {
        code: 'TENANT_NOT_FOUND',
        message: `Tenant '${identifier}' not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class TenantSlugConflictException extends AppException {
  constructor(slug: string) {
    super(
      {
        code: 'TENANT_SLUG_CONFLICT',
        message: `Tenant with slug '${slug}' already exists`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class TenantSuspendedException extends AppException {
  constructor(tenantId: string) {
    super(
      {
        code: 'TENANT_SUSPENDED',
        message: `Tenant '${tenantId}' is suspended`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TenantLimitExceededException extends AppException {
  constructor(resource: string, limit: number) {
    super(
      {
        code: 'TENANT_LIMIT_EXCEEDED',
        message: `Tenant has reached the maximum limit of ${limit} ${resource}`,
        details: { resource, limit },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

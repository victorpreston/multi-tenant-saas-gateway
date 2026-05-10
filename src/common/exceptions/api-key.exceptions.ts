import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class ApiKeyNotFoundException extends AppException {
  constructor(identifier: string) {
    super(
      {
        code: 'API_KEY_NOT_FOUND',
        message: `API key '${identifier}' not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ApiKeyRevokedException extends AppException {
  constructor() {
    super(
      {
        code: 'API_KEY_REVOKED',
        message: 'This API key has been revoked',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ApiKeyExpiredException extends AppException {
  constructor() {
    super(
      {
        code: 'API_KEY_EXPIRED',
        message: 'This API key has expired',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ApiKeyLimitExceededException extends AppException {
  constructor(limit: number) {
    super(
      {
        code: 'API_KEY_LIMIT_EXCEEDED',
        message: `Maximum number of active API keys (${limit}) reached for this tenant`,
        details: { limit },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

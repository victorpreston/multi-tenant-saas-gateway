import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

export class UserNotFoundException extends AppException {
  constructor(identifier: string) {
    super(
      {
        code: 'USER_NOT_FOUND',
        message: `User '${identifier}' not found`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UserEmailConflictException extends AppException {
  constructor(email: string) {
    super(
      {
        code: 'USER_EMAIL_CONFLICT',
        message: `User with email '${email}' already exists in this tenant`,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UserInactiveException extends AppException {
  constructor(userId: string) {
    super(
      {
        code: 'USER_INACTIVE',
        message: `User '${userId}' account is inactive or suspended`,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidCredentialsException extends AppException {
  constructor() {
    super(
      {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class EmailNotVerifiedException extends AppException {
  constructor() {
    super(
      {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TokenExpiredException extends AppException {
  constructor() {
    super(
      {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please log in again',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidTokenException extends AppException {
  constructor() {
    super(
      {
        code: 'INVALID_TOKEN',
        message: 'Invalid or malformed token',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserData {
  userId: string;
  email: string;
  tenantId: string;
}

/**
 * CurrentUser decorator
 * Extracts user information from JWT token in the request
 * Usage: @CurrentUser() user: CurrentUserData
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserData;

    if (!user) {
      throw new Error(
        'User not found in request. Make sure JwtGuard is applied.',
      );
    }

    return user;
  },
);

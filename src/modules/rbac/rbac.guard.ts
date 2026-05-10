import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RbacService } from './rbac.service';
import {
  PERMISSIONS_KEY,
  PermissionRequirement,
} from '../../common/decorators/require-permissions.decorator';
import { ROLES_KEY } from '../../common/decorators/require-roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionRequirement[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length && !requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (requiredRoles?.length) {
      const userRoles = await this.rbacService.getUserRoleNames(
        user.userId,
        user.tenantId,
      );
      if (!this.rbacService.hasRole(userRoles, requiredRoles)) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: `Required roles: ${requiredRoles.join(', ')}`,
        });
      }
    }

    if (requiredPermissions?.length) {
      const userPermissions = await this.rbacService.getUserPermissions(
        user.userId,
        user.tenantId,
      );
      if (
        !this.rbacService.hasPermission(userPermissions, requiredPermissions)
      ) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: `Missing required permissions`,
        });
      }
    }

    return true;
  }
}

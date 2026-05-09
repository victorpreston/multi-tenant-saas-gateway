import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_RESOURCE_KEY = 'audit_resource';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const resourceType = this.reflector.getAllAndOverride<string>(
      AUDIT_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!action || !resourceType) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    const tenantId =
      (request.headers['x-tenant-id'] as string) || user?.tenantId || '';
    const rawIp = request.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(rawIp)
      ? rawIp[0]
      : (rawIp ?? request.socket.remoteAddress ?? '');
    const userAgent = request.headers['user-agent'] || '';
    const resourceId = request.params['id'] || undefined;

    const writeLog = (status: 'SUCCESS' | 'FAILURE', err?: unknown) =>
      this.auditService.log({
        tenantId,
        userId: user?.userId,
        action,
        resourceType,
        resourceId,
        status,
        errorMessage:
          status === 'FAILURE' && err instanceof Error
            ? err.message
            : undefined,
        ipAddress,
        userAgent,
      });

    return next.handle().pipe(
      tap(() => {
        void writeLog('SUCCESS');
      }),
      catchError((err: unknown) => {
        void writeLog('FAILURE', err);
        return throwError(() => err);
      }),
    );
  }
}

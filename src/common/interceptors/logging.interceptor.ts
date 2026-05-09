import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    const { method, url } = request;
    const rawTenantId = request.headers['x-tenant-id'];
    const tenantId = Array.isArray(rawTenantId)
      ? rawTenantId[0]
      : (rawTenantId ?? 'unknown');
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${requestId}] ${method} ${url} → ${statusCode} (${duration}ms) tenant=${tenantId}`,
          );
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `[${requestId}] ${method} ${url} → ERROR (${duration}ms) tenant=${tenantId}`,
          );
        },
      }),
    );
  }
}

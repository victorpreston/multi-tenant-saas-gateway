import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    this.logger.error(
      `[${request.method}] ${request.url} → ${errorResponse.statusCode} ${errorResponse.code}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const path = request.url;
    const timestamp = new Date().toISOString();
    const requestId = (request.headers['x-request-id'] as string) || undefined;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let code = 'HTTP_ERROR';
      let message = exception.message;
      let details: unknown;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp['code'] as string) || this.statusToCode(status);
        message = (resp['message'] as string) || exception.message;
        details = resp['details'];

        // Handle class-validator validation errors
        if (Array.isArray(resp['message'])) {
          code = 'VALIDATION_ERROR';
          message = 'Request validation failed';
          details = resp['message'];
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.statusToCode(status);
      }

      return {
        statusCode: status,
        code,
        message,
        details,
        path,
        timestamp,
        requestId,
      };
    }

    if (exception instanceof QueryFailedError) {
      const pgError = exception as QueryFailedError & { code?: string };
      if (pgError.code === '23505') {
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'DUPLICATE_ENTRY',
          message: 'A record with the same unique value already exists',
          path,
          timestamp,
          requestId,
        };
      }
      if (pgError.code === '23503') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced resource does not exist',
          path,
          timestamp,
          requestId,
        };
      }
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'ENTITY_NOT_FOUND',
        message: 'Requested resource not found',
        path,
        timestamp,
        requestId,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      path,
      timestamp,
      requestId,
    };
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] || 'HTTP_ERROR';
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class AppException extends HttpException {
  constructor(
    payload: AppErrorPayload,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(payload, status);
  }
}

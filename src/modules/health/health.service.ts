import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok' | 'error';
  info: Record<string, any>;
  error: Record<string, any>;
  details: Record<string, any>;
}

@Injectable()
export class HealthService {
  getHealthStatus(): HealthResponse {
    const healthInfo = {
      'api-gateway': {
        status: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };

    return {
      status: 'ok',
      info: healthInfo,
      error: {},
      details: healthInfo,
    };
  }

  getReadyStatus(): HealthResponse {
    const readyInfo = {
      'api-gateway': {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
    };

    return {
      status: 'ok',
      info: readyInfo,
      error: {},
      details: readyInfo,
    };
  }
}

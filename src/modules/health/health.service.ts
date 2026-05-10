import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthResponse {
  status: 'ok' | 'error';
  info: Record<string, unknown>;
  error: Record<string, unknown>;
  details: Record<string, unknown>;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealthStatus(): Promise<HealthResponse> {
    const dbStatus = await this.checkDatabase();

    const info: Record<string, unknown> = {
      'api-gateway': {
        status: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      database: dbStatus,
    };

    const hasError = dbStatus.status === 'down';

    return {
      status: hasError ? 'error' : 'ok',
      info,
      error: hasError ? { database: dbStatus } : {},
      details: info,
    };
  }

  async getReadyStatus(): Promise<HealthResponse> {
    const dbStatus = await this.checkDatabase();
    const isReady = dbStatus.status === 'up';

    const info: Record<string, unknown> = {
      'api-gateway': {
        status: isReady ? 'ready' : 'not-ready',
        timestamp: new Date().toISOString(),
      },
      database: dbStatus,
    };

    return {
      status: isReady ? 'ok' : 'error',
      info,
      error: isReady ? {} : { database: dbStatus },
      details: info,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    responseTime?: number;
    message?: string;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', responseTime: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

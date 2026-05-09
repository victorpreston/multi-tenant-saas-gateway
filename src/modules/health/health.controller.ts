import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import type { HealthResponse } from './health.service';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe — checks process and database' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive and responding',
    schema: {
      example: {
        status: 'ok',
        info: {
          'api-gateway': {
            status: 'up',
            uptime: 123.45,
            timestamp: '2026-01-11T15:30:00.000Z',
          },
          database: { status: 'up', responseTime: 3 },
        },
        error: {},
        details: {},
      },
    },
  })
  async getLiveness(): Promise<HealthResponse> {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — service ready for traffic' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready for traffic',
    schema: {
      example: {
        status: 'ok',
        info: {
          'api-gateway': {
            status: 'ready',
            timestamp: '2026-01-11T15:30:00.000Z',
          },
          database: { status: 'up', responseTime: 2 },
        },
        error: {},
        details: {},
      },
    },
  })
  async getReadiness(): Promise<HealthResponse> {
    return this.healthService.getReadyStatus();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { HealthResponse } from './health.service';
import { HealthService } from './health.service';

@Controller('api')
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
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
        },
        error: {},
        details: {
          'api-gateway': {
            status: 'up',
            uptime: 123.45,
            timestamp: '2026-01-11T15:30:00.000Z',
          },
        },
      },
    },
  })
  getLiveness(): HealthResponse {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
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
        },
        error: {},
        details: {
          'api-gateway': {
            status: 'ready',
            timestamp: '2026-01-11T15:30:00.000Z',
          },
        },
      },
    },
  })
  getReadiness(): HealthResponse {
    return this.healthService.getReadyStatus();
  }
}

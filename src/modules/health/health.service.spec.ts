import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthService } from './health.service';

type GatewayInfo = { status: string; uptime?: number; timestamp: string };

function gatewayInfo(
  response: Awaited<ReturnType<HealthService['getHealthStatus']>>,
): GatewayInfo {
  return response.info['api-gateway'] as GatewayInfo;
}

describe('HealthService', () => {
  let service: HealthService;

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(HealthService);
    jest.clearAllMocks();
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
  });

  describe('getHealthStatus', () => {
    it('returns status ok when database is reachable', async () => {
      const result = await service.getHealthStatus();
      expect(result.status).toBe('ok');
    });

    it('reports api-gateway as up', async () => {
      const result = await service.getHealthStatus();
      expect(gatewayInfo(result).status).toBe('up');
    });

    it('includes a non-negative uptime', async () => {
      const result = await service.getHealthStatus();
      expect(gatewayInfo(result).uptime).toBeGreaterThanOrEqual(0);
    });

    it('reports database as up when query succeeds', async () => {
      const result = await service.getHealthStatus();
      const db = result.info['database'] as { status: string };
      expect(db.status).toBe('up');
    });

    it('returns error status when database is unreachable', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection refused'));
      const result = await service.getHealthStatus();
      expect(result.status).toBe('error');
    });
  });

  describe('getReadyStatus', () => {
    it('returns status ok when database is reachable', async () => {
      const result = await service.getReadyStatus();
      expect(result.status).toBe('ok');
    });

    it('reports api-gateway as ready', async () => {
      const result = await service.getReadyStatus();
      expect(gatewayInfo(result).status).toBe('ready');
    });

    it('includes a valid timestamp', async () => {
      const result = await service.getReadyStatus();
      expect(new Date(gatewayInfo(result).timestamp).getTime()).not.toBeNaN();
    });

    it('returns error status when database is unreachable', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection refused'));
      const result = await service.getReadyStatus();
      expect(result.status).toBe('error');
    });
  });
});

import { HealthService, HealthResponse } from './health.service';

type GatewayInfo = { status: string; uptime?: number; timestamp: string };

function gatewayInfo(response: HealthResponse): GatewayInfo {
  return response.info['api-gateway'] as GatewayInfo;
}

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  describe('getHealthStatus', () => {
    it('returns status ok', () => {
      const result = service.getHealthStatus();
      expect(result.status).toBe('ok');
    });

    it('reports api-gateway as up', () => {
      expect(gatewayInfo(service.getHealthStatus()).status).toBe('up');
    });

    it('includes a non-negative uptime', () => {
      const info = gatewayInfo(service.getHealthStatus());
      expect(info.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns empty error object', () => {
      const result = service.getHealthStatus();
      expect(result.error).toEqual({});
    });

    it('mirrors info into details', () => {
      const result = service.getHealthStatus();
      expect(result.details).toEqual(result.info);
    });
  });

  describe('getReadyStatus', () => {
    it('returns status ok', () => {
      const result = service.getReadyStatus();
      expect(result.status).toBe('ok');
    });

    it('reports api-gateway as ready', () => {
      expect(gatewayInfo(service.getReadyStatus()).status).toBe('ready');
    });

    it('includes a valid timestamp', () => {
      const info = gatewayInfo(service.getReadyStatus());
      expect(new Date(info.timestamp).getTime()).not.toBeNaN();
    });

    it('returns empty error object', () => {
      const result = service.getReadyStatus();
      expect(result.error).toEqual({});
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';
import type { TenantRequest } from './tenant.middleware';
import type { Response, NextFunction } from 'express';

const mockResponse = {} as Response;
const mockNext: NextFunction = jest.fn();

function makeRequest(
  headers: Record<string, string>,
  host?: string,
): TenantRequest {
  return {
    headers: { ...headers, host: host ?? 'localhost' },
    get: (name: string) =>
      headers[name.toLowerCase()] ??
      (name === 'host' ? (host ?? 'localhost') : undefined),
  } as unknown as TenantRequest;
}

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;

  beforeEach(() => {
    middleware = new TenantMiddleware();
    jest.clearAllMocks();
  });

  it('extracts tenantId from X-Tenant-ID header', () => {
    const req = makeRequest({ 'x-tenant-id': 'my-tenant' });
    middleware.use(req, mockResponse, mockNext);
    expect(req.tenantId).toBe('my-tenant');
    expect(mockNext).toHaveBeenCalled();
  });

  it('extracts tenantId from subdomain when header is absent', () => {
    const req = makeRequest({}, 'acme.example.com');
    middleware.use(req, mockResponse, mockNext);
    expect(req.tenantId).toBe('acme');
    expect(mockNext).toHaveBeenCalled();
  });

  it('prefers header over subdomain when both are present', () => {
    const req = makeRequest(
      { 'x-tenant-id': 'header-tenant' },
      'sub.example.com',
    );
    middleware.use(req, mockResponse, mockNext);
    expect(req.tenantId).toBe('header-tenant');
  });

  it('throws BadRequestException when neither header nor subdomain is present', () => {
    const req = makeRequest({}, 'localhost');
    expect(() => middleware.use(req, mockResponse, mockNext)).toThrow(
      BadRequestException,
    );
  });

  it('does not extract subdomain from two-part hostname', () => {
    const req = makeRequest({}, 'example.com');
    expect(() => middleware.use(req, mockResponse, mockNext)).toThrow(
      BadRequestException,
    );
  });
});

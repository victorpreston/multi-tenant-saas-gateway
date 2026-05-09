import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

function makeHost(statusCode: number) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = {
    method: 'GET',
    url: '/test',
    headers: {},
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };
  return { host, json, status, statusCode };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('handles BadRequestException with 400 status', () => {
    const { host, status, json } = makeHost(400);
    filter.catch(new BadRequestException('Invalid input'), host as never);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('handles NotFoundException with 404 status', () => {
    const { host, status } = makeHost(404);
    filter.catch(new NotFoundException('Not found'), host as never);
    expect(status).toHaveBeenCalledWith(404);
  });

  it('handles UnauthorizedException with 401 status', () => {
    const { host, status } = makeHost(401);
    filter.catch(new UnauthorizedException(), host as never);
    expect(status).toHaveBeenCalledWith(401);
  });

  it('handles class-validator array of errors as VALIDATION_ERROR', () => {
    const { host, json } = makeHost(400);
    const exception = new BadRequestException({
      message: ['email must be a valid email', 'name must not be empty'],
      statusCode: 400,
    });
    filter.catch(exception, host as never);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });

  it('handles PostgreSQL duplicate entry error (23505) as CONFLICT', () => {
    const { host, status } = makeHost(409);
    const error = new QueryFailedError(
      'SELECT 1',
      [],
      new Error(),
    ) as QueryFailedError & { code: string };
    error.code = '23505';
    filter.catch(error, host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('handles PostgreSQL foreign key error (23503) as BAD_REQUEST', () => {
    const { host, status } = makeHost(400);
    const error = new QueryFailedError(
      'SELECT 1',
      [],
      new Error(),
    ) as QueryFailedError & { code: string };
    error.code = '23503';
    filter.catch(error, host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('handles EntityNotFoundError as NOT_FOUND', () => {
    const { host, status } = makeHost(404);
    filter.catch(new EntityNotFoundError('User', { id: '1' }), host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('handles unknown errors as 500', () => {
    const { host, status } = makeHost(500);
    filter.catch(new Error('Unexpected'), host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('includes requestId from header when present', () => {
    const { host, json } = makeHost(400);
    const req = (host as never as ReturnType<typeof makeHost>['host'])
      .switchToHttp()
      .getRequest() as { headers: Record<string, string> };
    req.headers['x-request-id'] = 'test-req-123';

    filter.catch(new BadRequestException(), host as never);
    const calls = json.mock.calls as Array<[{ requestId?: string }]>;
    expect(calls[0][0].requestId).toBe('test-req-123');
  });

  it('returns correct code for HttpException', () => {
    const { host, json } = makeHost(409);
    filter.catch(
      new HttpException(
        { code: 'CUSTOM_CODE', message: 'custom' },
        HttpStatus.CONFLICT,
      ),
      host as never,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CUSTOM_CODE' }),
    );
  });
});

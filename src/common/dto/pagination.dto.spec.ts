import { PaginatedResponseDto } from './pagination.dto';

describe('PaginatedResponseDto', () => {
  it('calculates totalPages correctly', () => {
    const dto = new PaginatedResponseDto(['a', 'b', 'c'], 25, 1, 10);
    expect(dto.totalPages).toBe(3);
  });

  it('returns 1 totalPage when items fit on one page', () => {
    const dto = new PaginatedResponseDto([1, 2], 2, 1, 10);
    expect(dto.totalPages).toBe(1);
  });

  it('rounds totalPages up (ceiling)', () => {
    const dto = new PaginatedResponseDto([], 11, 1, 10);
    expect(dto.totalPages).toBe(2);
  });

  it('sets data, total, page, and limit correctly', () => {
    const data = [{ id: '1' }];
    const dto = new PaginatedResponseDto(data, 100, 3, 20);
    expect(dto.data).toEqual(data);
    expect(dto.total).toBe(100);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(20);
    expect(dto.totalPages).toBe(5);
  });

  it('handles zero total correctly', () => {
    const dto = new PaginatedResponseDto([], 0, 1, 20);
    expect(dto.totalPages).toBe(0);
  });
});

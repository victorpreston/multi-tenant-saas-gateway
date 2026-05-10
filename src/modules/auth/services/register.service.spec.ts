import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterService } from './register.service';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { Tenant } from '../../../database/entities/tenant.entity';
import { RegisterDto } from '../dto';

const makeTenant = (overrides: Partial<Tenant> = {}): Tenant =>
  ({ id: 'tenant-id', name: 'Test Tenant', ...overrides }) as Tenant;

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-id',
    email: 'test@example.com',
    status: UserStatus.PENDING,
    emailVerified: false,
    passwordHash: '',
    ...overrides,
  }) as User;

describe('RegisterService', () => {
  let service: RegisterService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockTenantRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get(RegisterService);
    jest.clearAllMocks();
  });

  const dto: RegisterDto = {
    email: 'new@example.com',
    name: 'New User',
    password: 'password123',
    tenantId: '00000000-0000-0000-0000-000000000001',
  };

  it('throws BadRequestException when tenant does not exist', async () => {
    mockTenantRepo.findOne.mockResolvedValue(null);
    await expect(service.execute(dto)).rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException when email already exists in the tenant', async () => {
    mockTenantRepo.findOne.mockResolvedValue(makeTenant());
    mockUserRepo.findOne.mockResolvedValue(makeUser({ email: dto.email }));
    await expect(service.execute(dto)).rejects.toThrow(ConflictException);
  });

  it('creates and returns a new user with PENDING status', async () => {
    mockTenantRepo.findOne.mockResolvedValue(makeTenant());
    mockUserRepo.findOne.mockResolvedValue(null);
    const created = makeUser({ email: dto.email, name: dto.name });
    mockUserRepo.create.mockReturnValue(created);
    mockUserRepo.save.mockResolvedValue(created);

    const result = await service.execute(dto);
    expect(result.status).toBe(UserStatus.PENDING);
    expect(result.emailVerified).toBe(false);
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
  });

  it('hashes the password before saving', async () => {
    mockTenantRepo.findOne.mockResolvedValue(makeTenant());
    mockUserRepo.findOne.mockResolvedValue(null);
    const created = makeUser();
    mockUserRepo.create.mockImplementation((data: Partial<User>) => ({
      ...created,
      ...data,
    }));
    mockUserRepo.save.mockImplementation((u: User) => Promise.resolve(u));

    const result = await service.execute(dto);
    expect(result.passwordHash).toBeDefined();
    expect(result.passwordHash).not.toBe(dto.password);
  });
});

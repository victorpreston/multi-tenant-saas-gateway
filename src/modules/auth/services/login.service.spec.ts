import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LoginService } from './login.service';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { LoginDto } from '../dto';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: '',
    status: UserStatus.ACTIVE,
    lastLoginAt: null,
    ...overrides,
  }) as User;

describe('LoginService', () => {
  let service: LoginService;

  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(LoginService);
    jest.clearAllMocks();
  });

  const dto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
    tenantId: '00000000-0000-0000-0000-000000000001',
  };

  it('throws UnauthorizedException when user is not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.execute(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when password does not match', async () => {
    const hash = await bcrypt.hash('other-password', 10);
    mockRepo.findOne.mockResolvedValue(makeUser({ passwordHash: hash }));
    await expect(service.execute(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user status is ARCHIVED', async () => {
    const hash = await bcrypt.hash(dto.password, 10);
    mockRepo.findOne.mockResolvedValue(
      makeUser({ passwordHash: hash, status: UserStatus.ARCHIVED }),
    );
    await expect(service.execute(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user status is INACTIVE', async () => {
    const hash = await bcrypt.hash(dto.password, 10);
    mockRepo.findOne.mockResolvedValue(
      makeUser({ passwordHash: hash, status: UserStatus.INACTIVE }),
    );
    await expect(service.execute(dto)).rejects.toThrow(UnauthorizedException);
  });

  it('returns the user and updates lastLoginAt on valid credentials', async () => {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = makeUser({ passwordHash: hash, status: UserStatus.ACTIVE });
    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue({ ...user, lastLoginAt: new Date() });

    const result = await service.execute(dto);
    expect(result).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id }),
    );
  });

  it('also accepts PENDING status as valid for login', async () => {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = makeUser({ passwordHash: hash, status: UserStatus.PENDING });
    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    await expect(service.execute(dto)).resolves.toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordResetService } from './password-reset.service';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { PasswordResetToken } from '../../../database/entities/password-reset-token.entity';

const makeUser = (): User =>
  ({
    id: 'user-id',
    email: 'user@example.com',
    tenantId: 'tenant-id',
    status: UserStatus.ACTIVE,
    passwordHash: 'old-hash',
  }) as User;

const makeToken = (
  overrides: Partial<PasswordResetToken> = {},
): PasswordResetToken =>
  ({
    id: 'token-id',
    userId: 'user-id',
    tenantId: 'tenant-id',
    token: 'hashed-token',
    used: false,
    expiresAt: new Date(Date.now() + 3_600_000),
    user: makeUser(),
    ...overrides,
  }) as PasswordResetToken;

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  const mockUserRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockTokenRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockTokenRepo,
        },
      ],
    }).compile();

    service = module.get(PasswordResetService);
    jest.clearAllMocks();
    mockTokenRepo.create.mockImplementation((d: object) => d);
    mockTokenRepo.save.mockResolvedValue({});
    mockTokenRepo.update.mockResolvedValue({});
    mockUserRepo.save.mockResolvedValue({});
  });

  describe('requestReset', () => {
    const dto = { email: 'user@example.com', tenantId: 'tenant-id' };

    it('returns the same message whether user exists or not (no enumeration)', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const result = await service.requestReset(dto);
      expect(result.message).toContain('If that email exists');
    });

    it('creates a reset token when user exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      await service.requestReset(dto);
      expect(mockTokenRepo.save).toHaveBeenCalledTimes(1);
    });

    it('invalidates previous tokens before creating a new one', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      await service.requestReset(dto);
      expect(mockTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-id', used: false },
        { used: true },
      );
    });
  });

  describe('resetPassword', () => {
    const dto = {
      token: 'raw-token',
      tenantId: 'tenant-id',
      newPassword: 'newPassword123',
    };

    it('throws BadRequestException when token is invalid', async () => {
      mockTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates the user password and marks token as used', async () => {
      const token = makeToken();
      mockTokenRepo.findOne.mockResolvedValue(token);

      await service.resetPassword(dto);
      expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
      expect(token.used).toBe(true);
      expect(mockTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
    });
  });
});

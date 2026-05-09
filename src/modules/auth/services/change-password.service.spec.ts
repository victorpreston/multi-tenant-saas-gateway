import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordService } from './change-password.service';
import { User, UserStatus } from '../../../database/entities/user.entity';

const makeUser = (passwordHash: string): User =>
  ({
    id: 'user-id',
    tenantId: 'tenant-id',
    email: 'user@example.com',
    status: UserStatus.ACTIVE,
    passwordHash,
  }) as User;

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;
  const mockRepo = { findOne: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ChangePasswordService);
    jest.clearAllMocks();
    mockRepo.save.mockResolvedValue({});
  });

  it('throws NotFoundException when user does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(
      service.execute('uid', 'tid', {
        currentPassword: 'old',
        newPassword: 'new12345',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException when current password is wrong', async () => {
    const hash = await bcrypt.hash('correctPassword', 10);
    mockRepo.findOne.mockResolvedValue(makeUser(hash));
    await expect(
      service.execute('user-id', 'tenant-id', {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('updates password hash when current password is correct', async () => {
    const hash = await bcrypt.hash('currentPassword', 10);
    const user = makeUser(hash);
    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue(user);

    await service.execute('user-id', 'tenant-id', {
      currentPassword: 'currentPassword',
      newPassword: 'newPassword123',
    });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const saveCalls = mockRepo.save.mock.calls as Array<[User]>;
    const savedUser = saveCalls[0][0];
    expect(savedUser.passwordHash).not.toBe(hash);
    const isNewHashValid = await bcrypt.compare(
      'newPassword123',
      savedUser.passwordHash,
    );
    expect(isNewHashValid).toBe(true);
  });
});

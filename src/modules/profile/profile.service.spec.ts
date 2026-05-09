import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { User, UserStatus } from '../../database/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-id',
    email: 'user@example.com',
    name: 'Test User',
    tenantId: 'tenant-id',
    status: UserStatus.ACTIVE,
    emailVerified: false,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as User;

describe('ProfileService', () => {
  let service: ProfileService;
  const mockRepo = { findOne: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(ProfileService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile('uid', 'tid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns formatted profile', async () => {
      mockRepo.findOne.mockResolvedValue(makeUser());
      const result = await service.getProfile('user-id', 'tenant-id');
      expect(result.email).toBe('user@example.com');
      expect(result.emailVerified).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfile('uid', 'tid', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates name and returns profile', async () => {
      const user = makeUser();
      mockRepo.findOne.mockResolvedValue(user);
      mockRepo.save.mockResolvedValue({ ...user, name: 'Updated' });

      const result = await service.updateProfile('user-id', 'tenant-id', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });
  });
});

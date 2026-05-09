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
    emailVerified: true,
    lastLoginAt: new Date('2026-01-10'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-05'),
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
      expect(result.emailVerified).toBe(true);
    });

    it('includes lastLoginAt in response', async () => {
      const user = makeUser({ lastLoginAt: new Date('2026-01-10') });
      mockRepo.findOne.mockResolvedValue(user);
      const result = await service.getProfile('user-id', 'tenant-id');
      expect(result.lastLoginAt).toEqual(user.lastLoginAt);
    });

    it('does not expose passwordHash', async () => {
      mockRepo.findOne.mockResolvedValue(makeUser());
      const result = await service.getProfile('user-id', 'tenant-id');
      expect(result).not.toHaveProperty('passwordHash');
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

    it('does not change name when dto.name is not provided', async () => {
      const user = makeUser({ name: 'Original' });
      mockRepo.findOne.mockResolvedValue(user);
      mockRepo.save.mockResolvedValue(user);

      const result = await service.updateProfile('user-id', 'tenant-id', {});
      expect(result.name).toBe('Original');
    });
  });
});

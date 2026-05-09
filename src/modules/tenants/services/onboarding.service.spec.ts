import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnboardingService } from './onboarding.service';
import { Role } from '../../../database/entities/role.entity';
import { Permission } from '../../../database/entities/permission.entity';

const makePermission = (resource: string, action: string): Permission =>
  ({
    id: `${resource}-${action}`,
    resource,
    action,
    isActive: true,
  }) as Permission;

describe('OnboardingService', () => {
  let service: OnboardingService;

  const mockRoleRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockPermRepo = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(Permission), useValue: mockPermRepo },
      ],
    }).compile();

    service = module.get(OnboardingService);
    jest.clearAllMocks();
    mockRoleRepo.create.mockImplementation((d: object) => d);
    mockRoleRepo.save.mockResolvedValue({});
  });

  it('skips onboarding when tenant already has roles', async () => {
    mockRoleRepo.find.mockResolvedValue([{ id: 'existing' }]);
    await service.initializeTenant('tenant-id');
    expect(mockRoleRepo.save).not.toHaveBeenCalled();
  });

  it('creates 3 default roles when tenant is new', async () => {
    mockRoleRepo.find.mockResolvedValue([]);
    mockPermRepo.find.mockResolvedValue([
      makePermission('users', 'read'),
      makePermission('api-keys', 'read'),
      makePermission('api-keys', 'create'),
    ]);

    await service.initializeTenant('tenant-id');
    expect(mockRoleRepo.save).toHaveBeenCalledTimes(3);
  });

  it('marks default roles as system roles', async () => {
    mockRoleRepo.find.mockResolvedValue([]);
    mockPermRepo.find.mockResolvedValue([]);

    await service.initializeTenant('tenant-id');
    const calls = mockRoleRepo.create.mock.calls as Array<
      [{ isSystem: boolean }]
    >;
    expect(calls.every(([r]) => r.isSystem === true)).toBe(true);
  });
});

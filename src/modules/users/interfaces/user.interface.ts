import { UserStatus } from '../enums';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserPayload {
  name?: string;
  status?: UserStatus;
}

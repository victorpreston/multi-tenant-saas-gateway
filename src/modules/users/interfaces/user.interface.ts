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

/**
 * UpdateUserPayload - Partial user update
 * Note: Email updates are not allowed through this endpoint for security reasons.
 * Password changes should use a separate password change endpoint.
 */
export interface UpdateUserPayload {
  name?: string;
  status?: UserStatus;
}

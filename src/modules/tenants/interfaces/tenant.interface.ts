import { TenantStatus } from '../enums';

export interface TenantResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: TenantStatus;
  website?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo?: string;
}

export interface UpdateTenantPayload {
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  logo?: string;
  status?: TenantStatus;
}

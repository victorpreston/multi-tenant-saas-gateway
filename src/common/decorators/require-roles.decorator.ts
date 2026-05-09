import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'required_roles';

export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

import { Exclude } from 'class-transformer';

export class ApiKeyResponseDto {
  id: string;

  tenantId: string;

  name: string;

  key: string;

  @Exclude()
  secret: string;

  status: string;

  scopes: string[];

  expiresAt: Date | null;

  lastUsedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

export class ApiKeyWithSecretResponseDto extends ApiKeyResponseDto {
  declare secret: string;
}

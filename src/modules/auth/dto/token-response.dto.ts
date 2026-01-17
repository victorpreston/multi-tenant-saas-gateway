import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ example: 24 })
  expiresIn: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    example: {
      id: 'user-uuid',
      email: 'user@example.com',
      name: 'John Doe',
      tenantId: 'tenant-uuid',
      status: 'ACTIVE',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    status: string;
  };
}

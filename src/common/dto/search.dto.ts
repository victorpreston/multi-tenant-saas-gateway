import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search term (name or email)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class UserFilterDto extends SearchQueryDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED'])
  status?: string;
}

export class TenantFilterDto extends SearchQueryDto {
  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'])
  status?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  roleId: string;
}

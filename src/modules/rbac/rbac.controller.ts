import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RbacGuard } from './rbac.guard';
import { RbacService } from './rbac.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { CreateRoleDto, AssignRoleDto } from './dto';

@ApiTags('rbac')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions' })
  @RequirePermissions({ resource: 'roles', action: 'read' })
  listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles for current tenant' })
  @RequirePermissions({ resource: 'roles', action: 'read' })
  listRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.rbacService.listRoles(user.tenantId);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a role for current tenant' })
  @RequirePermissions({ resource: 'roles', action: 'create' })
  createRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rbacService.createRole(
      user.tenantId,
      dto.name,
      dto.description,
      dto.permissionIds,
    );
  }

  @Delete('roles/:roleId')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @RequirePermissions({ resource: 'roles', action: 'delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.rbacService.deleteRole(roleId, user.tenantId);
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @RequirePermissions({ resource: 'roles', action: 'update' })
  @HttpCode(HttpStatus.NO_CONTENT)
  assignRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rbacService.assignRoleToUser(userId, dto.roleId, user.tenantId);
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'roleId', type: 'string', format: 'uuid' })
  @RequirePermissions({ resource: 'roles', action: 'update' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.rbacService.removeRoleFromUser(userId, roleId, user.tenantId);
  }

  @Get('users/:userId/roles')
  @ApiOperation({ summary: 'Get roles assigned to a user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @RequirePermissions({ resource: 'roles', action: 'read' })
  getUserRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.rbacService.getUserRoleNames(userId, user.tenantId);
  }
}

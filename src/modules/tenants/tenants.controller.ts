import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantService } from './services';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { TenantResponseDto } from './interfaces';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from '../../common/dto/pagination.dto';
import { TenantFilterDto } from '../../common/dto/search.dto';

@ApiTags('tenants')
@ApiBearerAuth('JWT')
@UseInterceptors(AuditInterceptor)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @Audit('tenant.create', 'tenants')
  async create(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants (paginated, searchable)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'q', required: false, type: String, example: 'acme' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'],
  })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filter: TenantFilterDto,
  ): Promise<PaginatedResponseDto<TenantResponseDto>> {
    const { data, total } = await this.tenantService.findAll(
      pagination.page,
      pagination.limit,
      filter.q,
      filter.status,
    );
    return new PaginatedResponseDto(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Audit('tenant.update', 'tenants')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('tenant.delete', 'tenants')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tenantService.delete(id);
  }
}

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, ProfileResponseDto } from './dto/profile.dto';

@ApiTags('profile')
@ApiBearerAuth('JWT')
@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: HttpStatus.OK, type: ProfileResponseDto })
  async getProfile(
    @Request() req: { user: { userId: string; tenantId: string } },
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(req.user.userId, req.user.tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: HttpStatus.OK, type: ProfileResponseDto })
  async updateProfile(
    @Request() req: { user: { userId: string; tenantId: string } },
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(
      req.user.userId,
      req.user.tenantId,
      dto,
    );
  }
}

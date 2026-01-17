import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtGuard } from './guards';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  TokenResponseDto,
} from './dto';
import {
  RegisterService,
  LoginService,
  RefreshTokenService,
  TokenGeneratorService,
} from './services';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenGeneratorService: TokenGeneratorService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists in tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or tenant not found',
  })
  async register(@Body() dto: RegisterDto): Promise<TokenResponseDto> {
    const user = await this.registerService.execute(dto);
    return this.tokenGeneratorService.generate(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password',
  })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.loginService.execute(dto);
    return this.tokenGeneratorService.generate(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    const user = await this.refreshTokenService.execute(dto);
    return this.tokenGeneratorService.generate(user);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user information',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No valid JWT token provided',
  })
  getCurrentUser(
    @Request()
    req: {
      user: { userId: string; email: string; tenantId: string };
    },
  ) {
    return req.user;
  }
}

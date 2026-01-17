import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Guard
 * Use @UseGuards(JwtGuard) to protect routes
 * Automatically validates JWT token from Authorization header
 * Attaches user info to request.user if valid
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}

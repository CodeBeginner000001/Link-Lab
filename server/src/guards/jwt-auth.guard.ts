import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { INTERNAL_API_KEY } from 'src/decorators/internal.decorator';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { JwtPayload } from 'src/interfaces/auth.interface';

type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const isInternal = this.reflector.getAllAndOverride<boolean>(
      INTERNAL_API_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isInternal) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException({
        message: 'Access token is missing',
        error: 'Unauthorized',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'Access token is invalid or expired',
        error: 'Unauthorized',
      });
    }
  }
  private extractTokenFromRequest(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    const cookies = req.cookies as Record<string, unknown> | undefined;
    return typeof cookies?.access_token === 'string'
      ? cookies.access_token
      : undefined;
  }
}

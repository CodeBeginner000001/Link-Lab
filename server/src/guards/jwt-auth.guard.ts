import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { INTERNAL_API_KEY } from 'src/decorators/internal.decorator';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
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
    return false;
  }
}

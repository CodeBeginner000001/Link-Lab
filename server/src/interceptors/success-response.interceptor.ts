import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../interfaces/api-response.interface';
import { Reflector } from '@nestjs/core';
import { SKIP_RESPONSE_INTERCEPTOR_KEY } from 'src/decorators/skip-success-interceptor.decorator';

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<
  T,
  T | SuccessResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_INTERCEPTOR_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skip) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data: T): SuccessResponse<T> => {
        const statusCode =
          typeof response.statusCode === 'number'
            ? response.statusCode
            : HttpStatus.OK;

        return {
          success: true,
          statusCode,
          message: 'Request successful',
          data,
          timeStamp: new Date().toISOString(),
          path: request.originalUrl || request.url,
        };
      }),
    );
  }
}

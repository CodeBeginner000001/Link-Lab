import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

type RequestBody = Record<string, unknown>;

type HttpRequest = Request<ParamsDictionary, unknown, RequestBody, ParsedQs>;

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();

    const request = context.switchToHttp().getRequest<HttpRequest>();

    const method = request.method;
    const originalUrl = request.originalUrl;
    const ip = request.ip;
    const body: RequestBody = request.body;

    this.logger.log(
      `[Incoming] ${method} ${originalUrl} | IP: ${ip} | Body: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[Success] ${method} ${originalUrl} | ${Date.now() - now}ms`,
        );
      }),
      catchError((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.error(
          `[Failed] ${method} ${originalUrl} | ${Date.now() - now}ms | Error: ${message}`,
        );

        return throwError(() => error);
      }),
    );
  }
}

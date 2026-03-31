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

const REDACTED_VALUE = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, '').toLowerCase();

  return (
    normalized.includes('password') ||
    normalized === 'otp' ||
    normalized.endsWith('otp') ||
    normalized === 'token' ||
    normalized.endsWith('token') ||
    normalized === 'authorization' ||
    normalized === 'cookie' ||
    normalized.endsWith('cookie') ||
    normalized === 'signupsession' ||
    normalized === 'forgotpasswordsession'
  );
}

function sanitizeUrlForLogging(url: string): string {
  const [path, queryString] = url.split('?', 2);

  if (!queryString) {
    return path;
  }

  const params = new URLSearchParams(queryString);

  for (const key of params.keys()) {
    if (isSensitiveKey(key)) {
      params.set(key, REDACTED_VALUE);
    }
  }

  const sanitizedQuery = params.toString();
  return sanitizedQuery ? `${path}?${sanitizedQuery}` : path;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();

    const request = context.switchToHttp().getRequest<HttpRequest>();

    const method = request.method;
    const originalUrl = sanitizeUrlForLogging(request.originalUrl);
    const ip = request.ip;

    this.logger.log(`[Incoming] ${method} ${originalUrl} | IP: ${ip}`);

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

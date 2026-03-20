import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const exceptionObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        message = exceptionObj.message ?? message;
        error = exceptionObj.error ?? exception.name;
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timeStamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    };

    response.status(statusCode).json(errorResponse);
  }
}

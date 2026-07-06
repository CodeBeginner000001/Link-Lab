import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/api-response.interface';

const VALIDATION_CONSTRAINT_PRIORITY = [
  'isDefined',
  'isNotEmpty',
  'isNotEmptyObject',
  'isString',
  'isUrl',
  'isEnum',
  'isBoolean',
  'isInt',
  'isEmail',
  'minLength',
  'length',
  'matches',
  'maxLength',
  'min',
  'max',
] as const;

function pickValidationMessage(
  constraints?: ValidationError['constraints'],
): string | undefined {
  if (!constraints) {
    return undefined;
  }

  for (const constraint of VALIDATION_CONSTRAINT_PRIORITY) {
    const message = constraints[constraint];
    if (message) {
      return message;
    }
  }

  return Object.values(constraints)[0];
}

function collectValidationMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const message = pickValidationMessage(error.constraints);
    if (message) {
      return [message];
    }

    if (error.children?.length) {
      return collectValidationMessages(error.children);
    }

    return [];
  });
}

function isValidationErrorArray(value: unknown): value is ValidationError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        ('constraints' in item || 'children' in item),
    )
  );
}

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
          details?: unknown;
          saved?: boolean;
        };

        if (isValidationErrorArray(exceptionObj.details)) {
          const validationMessages = collectValidationMessages(
            exceptionObj.details,
          );
          message =
            validationMessages.length > 0
              ? validationMessages
              : (exceptionObj.message ?? message);
        } else {
          message = exceptionObj.message ?? message;
        }

        error = exceptionObj.error ?? exception.name;
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      ...(exception instanceof HttpException &&
      typeof exception.getResponse() === 'object' &&
      exception.getResponse() !== null &&
      (exception.getResponse() as { saved?: boolean }).saved === true
        ? { saved: true }
        : {}),
      timeStamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    };

    response.status(statusCode).json(errorResponse);
  }
}

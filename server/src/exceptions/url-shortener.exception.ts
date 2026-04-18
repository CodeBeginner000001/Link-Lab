import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class ShortUrlAliasAlreadyInUseException extends ConflictException {
  constructor() {
    super({
      message: 'Custom alias is already in use',
      error: 'Conflict',
    });
  }
}

export class ShortUrlAliasGenerationFailedException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Could not generate a unique short URL alias',
      error: 'Internal Server Error',
    });
  }
}

export class ShortUrlNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Short URL not found',
      error: 'Not Found',
    });
  }
}

export class ShortUrlAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this short URL',
      error: 'Forbidden',
    });
  }
}

export class ShortUrlUpdateFieldsRequiredException extends BadRequestException {
  constructor() {
    super({
      message: 'At least one field is required to update the short URL',
      error: 'Bad Request',
    });
  }
}

export class ShortUrlNoChangesException extends BadRequestException {
  constructor() {
    super({
      message: 'No changes detected for the short URL',
      error: 'Bad Request',
    });
  }
}

export class ShortUrlDuplicateRequestException extends BadRequestException {
  constructor() {
    super({
      message: 'Same request body already exists for this short URL',
      error: 'Bad Request',
    });
  }
}

export class ReservedShortUrlAliasException extends BadRequestException {
  constructor() {
    super({
      message: 'Custom alias is reserved and cannot be used',
      error: 'Bad Request',
    });
  }
}

export class InvalidShortUrlAliasException extends BadRequestException {
  constructor(
    message = 'Alias must be 3 to 32 characters and use lowercase letters, numbers, underscores, or hyphens only',
  ) {
    super({
      message,
      error: 'Bad Request',
    });
  }
}

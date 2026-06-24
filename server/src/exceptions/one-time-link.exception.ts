import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class OneTimeLinkAliasAlreadyInUseException extends ConflictException {
  constructor() {
    super({
      message: 'Alias is already in use',
      error: 'Conflict',
    });
  }
}

export class OneTimeLinkAliasGenerationFailedException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Could not generate a unique one-time link alias',
      error: 'Internal Server Error',
    });
  }
}

export class OneTimeLinkNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Link not found or already used',
      error: 'Not Found',
    });
  }
}

export class OneTimeLinkAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this one-time link',
      error: 'Forbidden',
    });
  }
}

export class OneTimeLinkPasswordRequiredException extends ForbiddenException {
  constructor() {
    super({
      message: 'Password is required to open this one-time link',
      error: 'Forbidden',
    });
  }
}

export class OneTimeLinkInvalidPasswordException extends ForbiddenException {
  constructor() {
    super({
      message: 'Password is incorrect',
      error: 'Forbidden',
    });
  }
}

export class OneTimeLinkDeleteUnavailableException extends BadRequestException {
  constructor() {
    super({
      message: 'Link cannot be deleted',
      error: 'Bad Request',
    });
  }
}

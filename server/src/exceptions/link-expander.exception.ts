import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class LinkExpanderNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Expanded link not found',
      error: 'Not Found',
    });
  }
}

export class LinkExpanderAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this expanded link',
      error: 'Forbidden',
    });
  }
}

export class LinkExpansionFailedException extends ServiceUnavailableException {
  constructor(message = 'Unable to expand this link') {
    super({
      message,
      error: 'Service Unavailable',
      saved: true,
    });
  }
}

export class LinkExpanderDuplicateRequestException extends BadRequestException {
  constructor() {
    super({
      message: 'Same link is already present in your expanded links',
      error: 'Bad Request',
    });
  }
}

export class LinkExpanderAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      message: 'Expanded link already exists',
      error: 'Conflict',
    });
  }
}

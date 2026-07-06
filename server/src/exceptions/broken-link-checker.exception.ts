import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class BrokenLinkCheckNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Link check not found',
      error: 'Not Found',
    });
  }
}

export class BrokenLinkCheckAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this link check',
      error: 'Forbidden',
    });
  }
}

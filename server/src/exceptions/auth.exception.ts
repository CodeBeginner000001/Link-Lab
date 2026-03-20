import { ConflictException } from '@nestjs/common';

export class UserAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      message: 'An account with this email already exists',
      error: 'Conflict',
    });
  }
}

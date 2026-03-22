import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export class UserAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      message: 'An account with this email already exists',
      error: 'Conflict',
    });
  }
}
export class SignupAlreadyInProgressException extends ConflictException {
  constructor() {
    super({
      message: 'A signup session is already in progress for this email',
      error: 'Conflict',
    });
  }
}

export class EmailDeliveryException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Failed to send verification email',
      error: 'Internal Server Error',
    });
  }
}

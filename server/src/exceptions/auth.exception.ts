import {
  BadRequestException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
  UnauthorizedException,
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

export class WelcomeEmailDeliveryException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Account verified, but failed to queue welcome email',
      error: 'Internal Server Error',
    });
  }
}

export class SignupSessionNotFoundException extends GoneException {
  constructor() {
    super({
      message: 'Signup session not found or expired',
      error: 'Gone',
    });
  }
}

export class OtpExpiredException extends GoneException {
  constructor() {
    super({
      message: 'OTP has expired. Please request a new one.',
      error: 'Gone',
    });
  }
}

export class InvalidOtpException extends UnauthorizedException {
  constructor(attemptsLeft: number) {
    super({
      message: `Invalid OTP.  ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining`,
      error: 'Unauthorized',
    });
  }
}

export class OtpAttemptsExceededException extends BadRequestException {
  constructor() {
    super({
      message: 'OTP verification attempts exceeded. Please sign up again.',
      error: 'Too Many Requests',
    });
  }
}

export class OtpResendCooldownException extends BadRequestException {
  constructor(retryAfterSeconds: number) {
    super({
      message: `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} before trying OTP verification again`,
      error: 'Too Many Requests',
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  GoneException,
  InternalServerErrorException,
  NotFoundException,
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

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Invalid Credentials. Please check email carefully',
      error: 'Not Found',
    });
  }
}
export class SignupAlreadyInProgressException extends ConflictException {
  constructor() {
    super({
      message: 'Signup is already in progress. Please try again after sometime',
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
export class ForgetPasswordSessionNotFoundException extends GoneException {
  constructor() {
    super({
      message: 'Forget Password session not found or expired',
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
      message: 'OTP verification attempts exceeded. Please try again.',
      error: 'Too Many Requests',
    });
  }
}

export class ResendOtpCooldownException extends BadRequestException {
  constructor(retryAfterSeconds: number) {
    super({
      message: `Please wait ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} before requesting a new OTP`,
      error: 'Too Many Requests',
    });
  }
}

export class ResendAttemptsExceededException extends BadRequestException {
  constructor() {
    super({
      message: 'Maximum OTP resend attempts exceeded. Please try again',
      error: 'Too Many Requests',
    });
  }
}

export class ForgotPasswordAlreadyInProgressException extends ConflictException {
  constructor() {
    super({
      message:
        'A password reset session is already in progress for this email. Please try again after sometime..',
      error: 'Conflict',
    });
  }
}

export class ForgotPasswordEmailDeliveryException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Failed send password reset verification email',
      error: 'Internal Server Error',
    });
  }
}
export class ForgotPasswordNotVerifiedException extends BadRequestException {
  constructor() {
    super({
      message: 'Forgot password OTP has not been verified yet',
      error: 'Bad Request',
    });
  }
}

export class InvalidResetTokenException extends BadRequestException {
  constructor() {
    super({
      message: 'Invalid reset token',
      error: 'Bad Request',
    });
  }
}

export class ResetTokenExpiredException extends GoneException {
  constructor() {
    super({
      message:
        'Reset token has expired. Please restart the forgot password flow',
      error: 'Gone',
    });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid email or password',
      error: 'Unauthorized',
    });
  }
}

export class RefreshTokenMissingException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Refresh token is missing',
      error: 'Unauthorized',
    });
  }
}

export class RefreshTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Refresh token is invalid or expired',
      error: 'Unauthorized',
    });
  }
}

export class AuthenticatedUserNotFoundException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Authenticated user not found',
      error: 'Unauthorized',
    });
  }
}
export class AccessTokenExpired extends UnauthorizedException {
  constructor() {
    super({
      message: 'Access token is invalid or expired',
      error: 'Unauthorized',
    });
  }
}

import { ConflictException, UnauthorizedException } from '@nestjs/common';

export class InvalidGithubAccountException extends UnauthorizedException {
  constructor() {
    super({
      message: 'Invalid GitHub account details',
      error: 'Unauthorized',
    });
  }
}

export class GithubAccountConflictException extends ConflictException {
  constructor() {
    super({
      message: 'This email is already linked to a different GitHub account',
      error: 'Conflict',
    });
  }
}

export class GithubPasswordLoginUnavailableException extends UnauthorizedException {
  constructor() {
    super({
      message:
        'Profile is incomplete. Continue with GitHub and complete your profile',
      error: 'Unauthorized',
    });
  }
}

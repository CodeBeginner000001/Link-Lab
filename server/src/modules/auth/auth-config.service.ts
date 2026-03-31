import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthFlowConfigService {
  readonly otpAttempts: number;
  readonly maxOtpResendAttempts: number;
  readonly resendCooldownSeconds: number;
  readonly otpExpirationMinutes: number;
  readonly signupSessionTtlMinutes: number;
  readonly forgotPasswordTtlMinutes: number;
  readonly resetLinkExpirationMinutes: number;
  readonly frontendURL: string;

  constructor(private readonly configService: ConfigService) {
    this.otpAttempts = this.configService.getOrThrow<number>('OTP_ATTEMPTS');
    this.maxOtpResendAttempts = this.configService.getOrThrow<number>(
      'MAX_OTP_RESEND_ATTEMPTS',
    );
    this.resendCooldownSeconds = this.configService.getOrThrow<number>(
      'RESEND_COOLDOWN_SECOND',
    );
    this.otpExpirationMinutes = this.configService.getOrThrow<number>(
      'OTP_EXPIRATION_MINUTES',
    );
    this.signupSessionTtlMinutes = this.configService.getOrThrow<number>(
      'SIGNUP_SESSION_TTL_MINUTES',
    );
    this.forgotPasswordTtlMinutes = this.configService.getOrThrow<number>(
      'FORGOT_PASSWORD_TTL_MINUTES',
    );
    this.resetLinkExpirationMinutes = this.configService.getOrThrow<number>(
      'RESET_LINK_EXPIRATION_MINUTES',
    );
    this.frontendURL = this.configService.getOrThrow<string>('FRONTEND_URL');
  }
}

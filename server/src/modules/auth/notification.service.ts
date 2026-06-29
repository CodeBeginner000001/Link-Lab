import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/app.logger';
import {
  EmailDeliveryException,
  ForgotPasswordEmailDeliveryException,
} from 'src/exceptions/auth.exception';
import { SqsService } from 'src/services/aws/sqs/sqs.service';
import { renderTemplate } from 'src/utils/email.utils';
import {
  buildForgotPasswordEmailContext,
  FORGOT_PASSWORD_EMAIL_TEMPLATE,
} from './template/forget-password-verify-email.templates';
import {
  buildPasswordChangedEmailContext,
  PASSWORD_CHANGED_EMAIL_TEMPLATE,
} from './template/Password-change.templates';
import {
  buildResetPasswordEmailContext,
  RESET_PASSWORD_EMAIL_TEMPLATE,
} from './template/reset-password.templates';
import {
  buildVerifyEmailContext,
  VERIFY_EMAIL_TEMPLATE,
} from './template/verify-email.templates';
import {
  buildWelcomeEmailContext,
  WELCOME_EMAIL_TEMPLATE,
} from './template/welcome-email.templates';

export interface SignupOtpNotificationParams {
  email: string;
  name: string;
  otp: string;
  otpExpirationMinutes: number;
  requestId: string;
}

export interface WelcomeEmailNotificationParams {
  email: string;
  name: string;
  requestId: string;
  frontendUrl: string;
}

export interface ForgotPasswordOtpNotificationParams extends SignupOtpNotificationParams {
  frontendUrl: string;
}

export interface ResetPasswordLinkNotificationParams {
  email: string;
  name: string;
  resetToken: string;
  expiresInMinutes: number;
  requestId: string;
  frontendUrl: string;
}

export interface PasswordChangedEmailNotificationParams {
  email: string;
  name: string;
  changedAt: Date;
  deviceInfo: string;
  locationInfo: string;
  frontendUrl: string;
  requestId?: string;
}

@Injectable()
export class NotificationService {
  private readonly context = NotificationService.name;

  constructor(
    private readonly sqsService: SqsService,
    private readonly logger: AppLogger,
  ) {}

  async queueSignupOtp(params: SignupOtpNotificationParams): Promise<void> {
    const context = buildVerifyEmailContext(
      params.name,
      params.otp,
      params.otpExpirationMinutes,
    );
    const html = renderTemplate(VERIFY_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'VERIFY_EMAIL',
        senderName: 'Verify OTP - Link Lab',
        to: params.email,
        subject: 'Verify your email address',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: params.requestId,
        },
      });
    } catch {
      throw new EmailDeliveryException();
    }
  }

  async queueForgotPasswordOtp(
    params: ForgotPasswordOtpNotificationParams,
  ): Promise<void> {
    const context = buildForgotPasswordEmailContext({
      name: params.name,
      otp: params.otp,
      otpExpirationMinutes: params.otpExpirationMinutes,
      label1: 'Privacy Policy',
      label1Url: `${params.frontendUrl}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${params.frontendUrl}/help-center`,
    });
    const html = renderTemplate(FORGOT_PASSWORD_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'FORGOT_PASSWORD',
        senderName: 'Reset Password - Link Lab',
        to: params.email,
        subject: 'Reset your password',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: params.requestId,
        },
      });
    } catch {
      throw new ForgotPasswordEmailDeliveryException();
    }
  }

  async queueResetPasswordLink(
    params: ResetPasswordLinkNotificationParams,
  ): Promise<void> {
    const resetLink = `${params.frontendUrl}/reset-password/${encodeURIComponent(
      params.resetToken,
    )}`;
    const context = buildResetPasswordEmailContext({
      name: params.name,
      resetLink,
      expiration: params.expiresInMinutes,
      label1: 'Privacy Policy',
      label1Url: `${params.frontendUrl}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${params.frontendUrl}/help-center`,
    });
    const html = renderTemplate(RESET_PASSWORD_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'RESET_PASSWORD',
        senderName: 'Reset Password - Link Lab',
        to: params.email,
        subject: 'Reset your password',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: params.requestId,
        },
      });
    } catch {
      throw new ForgotPasswordEmailDeliveryException();
    }
  }

  async queueWelcomeEmail(
    params: WelcomeEmailNotificationParams,
  ): Promise<void> {
    const context = buildWelcomeEmailContext({
      name: params.name,
      frontend: params.frontendUrl,
      label1: 'Privacy Policy',
      label1Url: `${params.frontendUrl}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${params.frontendUrl}/help-center`,
      label3: 'Contact Us',
      label3Url: `${params.frontendUrl}/contact`,
    });
    const html = renderTemplate(WELCOME_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'WELCOME_EMAIL',
        senderName: 'Welcome - Link Lab',
        to: params.email,
        subject: 'Welcome to Link Lab',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: params.requestId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to queue welcome email for ${params.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
    }
  }

  async queuePasswordChangedEmail(
    params: PasswordChangedEmailNotificationParams,
  ): Promise<void> {
    const changeDate = params.changedAt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const changeTime = params.changedAt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const context = buildPasswordChangedEmailContext({
      name: params.name,
      changeDate,
      changeTime,
      deviceInfo: params.deviceInfo,
      locationInfo: params.locationInfo,
      label1: 'Privacy Policy',
      label1Url: `${params.frontendUrl}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${params.frontendUrl}/help-center`,
    });
    const html = renderTemplate(PASSWORD_CHANGED_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'RESET_PASSWORD',
        senderName: 'Password Changed - Link Lab',
        to: params.email,
        subject: 'Your password has been changed',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: params.requestId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to queue password changed email for ${params.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
    }
  }
}

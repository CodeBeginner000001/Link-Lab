import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StringValue } from 'ms';
import { AppLogger } from 'src/common/app.logger';
import {
  AuthenticatedUserNotFoundException,
  EmailDeliveryException,
  ForgetPasswordSessionNotFoundException,
  ForgotPasswordAlreadyInProgressException,
  ForgotPasswordEmailDeliveryException,
  ForgotPasswordNotVerifiedException,
  InvalidCredentialsException,
  InvalidOtpException,
  InvalidResetTokenException,
  OtpAttemptsExceededException,
  OtpExpiredException,
  RefreshTokenInvalidException,
  RefreshTokenMissingException,
  ResendAttemptsExceededException,
  ResendOtpCooldownException,
  ResetTokenExpiredException,
  SignupAlreadyInProgressException,
  SignupSessionNotFoundException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from 'src/exceptions/auth.exception';
import {
  ForgotPasswordSession,
  JwtPayload,
  SignupSession,
} from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import { SqsService } from 'src/services/aws/sqs/sqs.service';
import {
  buildForgotPasswordSession,
  buildSignupSession,
  comparePassword,
  generateOtp,
  generateSessionId,
  getMinutesToSeconds,
  hashPassword,
  normalizeEmail,
  normalizeName,
} from 'src/utils/auth.utils';
import { renderTemplate } from 'src/utils/email.utils';
import {
  getForgotPasswordLockKey,
  getForgotPasswordSessionKey,
  getSignupLockKey,
  getSignupSessionKey,
} from 'src/utils/redis-key.utils';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { LoginDto, SignupDto, VerifyOtpDto } from './dto/signup.dto';
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

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  private readonly otpAttempts: number;
  private readonly maxOtpResendAttempts: number;
  private readonly resendCooldownSeconds: number;
  private readonly otpExpirationMinutes: number;
  private readonly signupSessionTtlMinutes: number;
  private readonly resetLinkExpirationMinutes: number;
  private readonly forgotPasswordTtlMinutes: number;
  private readonly frontendURL: string;
  private readonly otpLength = 6;
  private readonly passwordSaltRounds = 12;

  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenTTL: string;
  private readonly refreshTokenTTL: string;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisHashService: RedisHashService,
    private readonly redisStringService: RedisStringService,
    private readonly sqsService: SqsService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
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
    this.resetLinkExpirationMinutes = this.configService.getOrThrow<number>(
      'RESET_LINK_EXPIRATION_MINUTES',
      5,
    );
    this.signupSessionTtlMinutes = this.configService.getOrThrow<number>(
      'SIGNUP_SESSION_TTL_MINUTES',
    );
    this.forgotPasswordTtlMinutes = this.configService.getOrThrow<number>(
      'FORGOT_PASSWORD_TTL_MINUTES',
    );
    this.frontendURL = this.configService.getOrThrow<string>('FRONTEND_URL');
    this.accessTokenSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshTokenSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessTokenTTL = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    this.refreshTokenTTL = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
  }
  async signup(dto: SignupDto) {
    const email = normalizeEmail(dto.email);
    const name = normalizeName(dto.name);

    this.logger.log(`Signup request received for ${email}`, this.context);

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      this.logger.warn(
        `Signup blocked: user already exists for ${email}`,
        this.context,
      );
      throw new UserAlreadyExistsException();
    }

    const sessionId = generateSessionId();
    const lockKey = getSignupLockKey(email);
    const sessionKey = getSignupSessionKey(sessionId);
    const sessionTtlSeconds = getMinutesToSeconds(this.signupSessionTtlMinutes);

    const lockResult = await this.redisStringService.createIfNotExists(
      lockKey,
      sessionId,
      sessionTtlSeconds,
    );

    if (!lockResult.created) {
      this.logger.warn(
        `Signup blocked because session already in progress for ${email}`,
        this.context,
      );
      throw new SignupAlreadyInProgressException();
    }
    try {
      const passwordHash = await hashPassword(
        dto.password,
        this.passwordSaltRounds,
      );
      const otp = generateOtp(this.otpLength);

      const signupSession = buildSignupSession({
        sessionId,
        name,
        email,
        passwordHash,
        otp,
        otpAttemptsLeft: this.otpAttempts,
        resendAttemptsLeft: this.maxOtpResendAttempts,
        resendCooldownSeconds: this.resendCooldownSeconds,
        otpExpirationMinutes: this.otpExpirationMinutes,
        signupSessionTtlMinutes: this.signupSessionTtlMinutes,
      });

      await this.redisHashService.create(
        sessionKey,
        signupSession,
        sessionTtlSeconds,
      );
      const context = buildVerifyEmailContext(
        name,
        otp,
        this.otpExpirationMinutes,
      );
      const html = renderTemplate(VERIFY_EMAIL_TEMPLATE, context);
      await this.sqsService.sendMail({
        type: 'VERIFY_EMAIL',
        senderName: 'Verify OTP - Link Lab',
        to: email,
        subject: 'Verify your email address',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: sessionId,
        },
      });

      this.logger.log(
        `Signup session created and verification email queued for ${email}`,
        this.context,
      );

      return {
        message: 'Signup initiated. Please verify OTP.',
        sessionId,
        signupSessionExpiresInMinutes: this.signupSessionTtlMinutes,
      };
    } catch (error) {
      await this.clearSignupState(lockKey, sessionKey);

      this.logger.error(
        `Signup flow failed for ${email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      if (
        error instanceof UserAlreadyExistsException ||
        error instanceof SignupAlreadyInProgressException ||
        error instanceof EmailDeliveryException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Unable to process signup request',
        error: 'Internal Server Error',
      });
    }
  }

  async verifySignupOtp(dto: VerifyOtpDto, sessionId: string) {
    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }

    const sessionKey = getSignupSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<SignupSession>(sessionKey);

    if (!value) {
      throw new SignupSessionNotFoundException();
    }

    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      throw new SignupSessionNotFoundException();
    }

    if (new Date(value.otpExpiresAt).getTime() <= Date.now()) {
      throw new OtpExpiredException();
    }

    if ((value.otpAttemptsLeft ?? 0) <= 0) {
      await this.clearSignupState(getSignupLockKey(value.email), sessionKey);
      throw new OtpAttemptsExceededException();
    }

    if (String(value.otp) !== dto.otp) {
      const attemptsLeft = Math.max((value.otpAttemptsLeft ?? 0) - 1, 0);

      await this.redisHashService.updateFields<SignupSession>(
        sessionKey,
        {
          otpAttemptsLeft: attemptsLeft,
        },
        undefined,
        true,
      );

      if (attemptsLeft <= 0) {
        await this.clearSignupState(getSignupLockKey(value.email), sessionKey);
        throw new OtpAttemptsExceededException();
      }

      throw new InvalidOtpException(attemptsLeft);
    }
    const existingUser = await this.userModel
      .findOne({ email: value.email })
      .lean();
    if (existingUser) {
      await this.clearSignupState(getSignupLockKey(value.email), sessionKey);
      throw new UserAlreadyExistsException();
    }
    const createdUser = await this.userModel.create({
      name: value.name,
      email: value.email,
      password: value.passwordHash,
    });
    const accessToken = await this.generateAccessToken(createdUser);
    const refreshToken = await this.generateRefreshToken(createdUser);
    const welcomeContext = buildWelcomeEmailContext({
      name: value.name,
      frontend: this.frontendURL,
      label1: 'Privacy Policy',
      label1Url: `${this.frontendURL}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${this.frontendURL}/help-center`,
      label3: 'Contact Us',
      label3Url: `${this.frontendURL}/contact`,
    });
    const welcomeHtml = renderTemplate(WELCOME_EMAIL_TEMPLATE, welcomeContext);

    await this.sqsService.sendMail({
      type: 'WELCOME_EMAIL',
      senderName: 'Welcome - Link Lab',
      to: value.email,
      subject: 'Welcome to Link Lab',
      html: welcomeHtml,
      context: welcomeContext,
      meta: {
        source: 'Link Lab',
        requestId: value.sessionId,
      },
    });

    await this.clearSignupState(getSignupLockKey(value.email), sessionKey);

    return {
      message: 'Email verified successfully.',
      accessToken,
      refreshToken,
    };
  }
  async resendSignupOtp(sessionId: string) {
    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }
    const sessionKey = getSignupSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<SignupSession>(sessionKey);

    if (!value) {
      throw new SignupSessionNotFoundException();
    }
    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      await this.clearSignupState(getSignupLockKey(value.email), sessionKey);
      throw new SignupSessionNotFoundException();
    }

    if ((value.resendAttemptsLeft ?? 0) <= 0) {
      await this.clearSignupState(getSignupLockKey(value.email), sessionKey);
      throw new ResendAttemptsExceededException();
    }
    if (value.lastResendAttemptAt) {
      const lastAttemptAt = new Date(value.lastResendAttemptAt).getTime();
      const nextAllowedAt =
        lastAttemptAt +
        (value.resendCooldownSeconds ?? this.resendCooldownSeconds) * 1000;

      if (Date.now() < nextAllowedAt) {
        const retryAfterSeconds = Math.ceil(
          (nextAllowedAt - Date.now()) / 1000,
        );
        throw new ResendOtpCooldownException(retryAfterSeconds);
      }
    }
    const otp = generateOtp(this.otpLength);
    const resendAttemptsLeft = Math.max((value.resendAttemptsLeft ?? 0) - 1, 0);
    const otpExpiresAt = Date.now() + this.otpExpirationMinutes * 60 * 1000;

    await this.redisHashService.updateFields<SignupSession>(
      sessionKey,
      {
        otp,
        resendAttemptsLeft,
        otpExpiresAt: new Date(otpExpiresAt).toISOString(),
        lastResendAttemptAt: new Date().toISOString(),
      },
      undefined,
      true,
    );
    const context = buildVerifyEmailContext(
      value.name,
      otp,
      this.otpExpirationMinutes,
    );
    const html = renderTemplate(VERIFY_EMAIL_TEMPLATE, context);
    try {
      await this.sqsService.sendMail({
        type: 'VERIFY_EMAIL',
        senderName: 'Verify OTP - Link Lab',
        to: value.email,
        subject: 'Verify your email address',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: value.sessionId,
        },
      });

      this.logger.log(
        `OTP resent successfully for ${value.email}`,
        this.context,
      );

      return {
        message: 'A new verification OTP has been send',
        otpExpiresAt: Math.floor(otpExpiresAt) / 1000,
      };
    } catch (error) {
      this.logger.error(
        `Failed to resend OTP for ${value.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      throw new EmailDeliveryException();
    }
  }

  async getSessionDetail(sessionId: string) {
    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }

    const sessionKey = getSignupSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<SignupSession>(sessionKey);
    if (!value) {
      throw new SignupSessionNotFoundException();
    }
    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      throw new SignupSessionNotFoundException();
    }

    const otpExpiresAt = Math.max(
      0,
      Math.ceil((new Date(value.otpExpiresAt).getTime() - Date.now()) / 1000),
    );

    return {
      email: value.email,
      otpExpiresAt,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.email);

    this.logger.log(
      `Forgot password request received for ${email}`,
      this.context,
    );

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (!existingUser) {
      this.logger.warn(
        `Forgot password blocked: no user found for ${email}`,
        this.context,
      );
      throw new UserNotFoundException();
    }

    const sessionId = generateSessionId();
    const lockKey = getForgotPasswordLockKey(email);
    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const sessionTtlSeconds = getMinutesToSeconds(this.signupSessionTtlMinutes);

    const lockResult = await this.redisStringService.createIfNotExists(
      lockKey,
      sessionId,
      sessionTtlSeconds,
    );

    if (!lockResult.created) {
      this.logger.warn(
        `Forgot password blocked because session already in progress for ${email}`,
        this.context,
      );
      throw new ForgotPasswordAlreadyInProgressException();
    }

    try {
      const otp = generateOtp(this.otpLength);

      const forgotPasswordSession = buildForgotPasswordSession({
        sessionId,
        email,
        otp,
        otpAttemptsLeft: this.otpAttempts,
        resendAttemptsLeft: this.maxOtpResendAttempts,
        resendCooldownSeconds: this.resendCooldownSeconds,
        otpExpirationMinutes: this.otpExpirationMinutes,
        forgotPasswordTtlMinutes: this.forgotPasswordTtlMinutes,
      });

      await this.redisHashService.create(
        sessionKey,
        forgotPasswordSession,
        sessionTtlSeconds,
      );

      const context = buildForgotPasswordEmailContext({
        name: existingUser.name,
        otp,
        otpExpirationMinutes: this.otpExpirationMinutes,
        label1: 'Privacy Policy',
        label1Url: `${this.frontendURL}/privacy-policy`,
        label2: 'Help Center',
        label2Url: `${this.frontendURL}/help-center`,
      });

      const html = renderTemplate(FORGOT_PASSWORD_EMAIL_TEMPLATE, context);

      await this.sqsService.sendMail({
        type: 'FORGOT_PASSWORD',
        senderName: 'Reset Password - Link Lab',
        to: email,
        subject: 'Reset your password',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: sessionId,
        },
      });

      this.logger.log(
        `Forgot password session created and reset email queued for ${email}`,
        this.context,
      );

      return {
        sessionId,
        message: 'Password reset verification email has been sent.',
        forgotPasswordSessionExpiresInMinutes: this.forgotPasswordTtlMinutes,
      };
    } catch (error) {
      await this.clearForgotPasswordState(lockKey, sessionKey);

      this.logger.error(
        `Forgot password flow failed for ${email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      if (
        error instanceof ForgotPasswordAlreadyInProgressException ||
        error instanceof UserNotFoundException ||
        error instanceof ForgotPasswordEmailDeliveryException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'Unable to process forgot password request',
        error: 'Internal Server Error',
      });
    }
  }
  async getForgetPasswordSessionDetail(sessionId: string) {
    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<SignupSession>(sessionKey);
    if (!value) {
      throw new ForgetPasswordSessionNotFoundException();
    }
    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const otpExpiresAt = Math.max(
      0,
      Math.ceil((new Date(value.otpExpiresAt).getTime() - Date.now()) / 1000),
    );

    return {
      email: value.email,
      otpExpiresAt,
    };
  }
  async verifyForgotPasswordOtp(dto: VerifyOtpDto, sessionId: string) {
    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<ForgotPasswordSession>(sessionKey);

    if (!value) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      throw new ForgetPasswordSessionNotFoundException();
    }
    if (new Date(value.otpExpiresAt).getTime() <= Date.now()) {
      throw new OtpExpiredException();
    }

    if ((value.otpAttemptsLeft ?? 0) <= 0) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new OtpAttemptsExceededException();
    }
    if (String(value.otp) !== String(dto.otp)) {
      const attemptsLeft = Math.max((value.otpAttemptsLeft ?? 0) - 1, 0);

      await this.redisHashService.updateFields<ForgotPasswordSession>(
        sessionKey,
        {
          otpAttemptsLeft: attemptsLeft,
        },
        undefined,
        true,
      );

      if (attemptsLeft <= 0) {
        await this.clearForgotPasswordState(
          getForgotPasswordLockKey(value.email),
          sessionKey,
        );
        throw new OtpAttemptsExceededException();
      }

      throw new InvalidOtpException(attemptsLeft);
    }
    const existingUser = await this.userModel
      .findOne({ email: value.email })
      .lean();
    if (!existingUser) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new UserNotFoundException();
    }
    const resetToken = generateSessionId();
    const resetTokenExpiresAt = new Date(
      Date.now() + this.resetLinkExpirationMinutes * 60 * 1000,
    ).toISOString();
    const resetLink = `${this.frontendURL}/reset-password/${encodeURIComponent(
      resetToken,
    )}`;
    await this.redisHashService.updateFields<ForgotPasswordSession>(
      sessionKey,
      {
        isVerified: true,
        resetToken,
        resetTokenExpiresAt,
      },
      undefined,
      true,
    );

    try {
      const context = buildResetPasswordEmailContext({
        name: existingUser.name,
        resetLink,
        expiration: this.resetLinkExpirationMinutes,
        label1: 'Privacy Policy',
        label1Url: `${this.frontendURL}/privacy-policy`,
        label2: 'Help Center',
        label2Url: `${this.frontendURL}/help-center`,
      });

      const html = renderTemplate(RESET_PASSWORD_EMAIL_TEMPLATE, context);

      await this.sqsService.sendMail({
        type: 'RESET_PASSWORD',
        senderName: 'Reset Password - Link Lab',
        to: value.email,
        subject: 'Reset your password',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: value.sessionId,
        },
      });

      this.logger.log(
        `Forgot password OTP verified and reset link queued for ${value.email}`,
        this.context,
      );

      return {
        message:
          'OTP verified successfully. Reset link has been sent to your email.',
        resetTokenExpiresInMintues: this.resetLinkExpirationMinutes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send reset link email for ${value.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      throw new ForgotPasswordEmailDeliveryException();
    }
  }
  async resendForgotPasswordOtp(sessionId: string) {
    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<ForgotPasswordSession>(sessionKey);

    if (!value) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new ForgetPasswordSessionNotFoundException();
    }

    if ((value.resendAttemptsLeft ?? 0) <= 0) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new ResendAttemptsExceededException();
    }

    if (value.lastResendAttemptAt) {
      const lastAttemptAt = new Date(value.lastResendAttemptAt).getTime();
      const nextAllowedAt =
        lastAttemptAt +
        (value.resendCooldownSeconds ?? this.resendCooldownSeconds) * 1000;

      if (Date.now() < nextAllowedAt) {
        const retryAfterSeconds = Math.ceil(
          (nextAllowedAt - Date.now()) / 1000,
        );
        throw new ResendOtpCooldownException(retryAfterSeconds);
      }
    }

    const existingUser = await this.userModel
      .findOne({ email: value.email })
      .lean();
    if (!existingUser) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new UserNotFoundException();
    }

    const otp = generateOtp(this.otpLength);
    const resendAttemptsLeft = Math.max((value.resendAttemptsLeft ?? 0) - 1, 0);
    const otpExpiresAt = Date.now() + this.otpExpirationMinutes * 60 * 1000;

    await this.redisHashService.updateFields<ForgotPasswordSession>(
      sessionKey,
      {
        otp,
        resendAttemptsLeft,
        otpExpiresAt: new Date(otpExpiresAt).toISOString(),
        lastResendAttemptAt: new Date().toISOString(),
        isVerified: false,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
      undefined,
      true,
    );

    const context = buildForgotPasswordEmailContext({
      name: existingUser.name,
      otp,
      otpExpirationMinutes: this.otpExpirationMinutes,
      label1: 'Privacy Policy',
      label1Url: `${this.frontendURL}/privacy-policy`,
      label2: 'Help Center',
      label2Url: `${this.frontendURL}/help-center`,
    });

    const html = renderTemplate(FORGOT_PASSWORD_EMAIL_TEMPLATE, context);

    try {
      await this.sqsService.sendMail({
        type: 'FORGOT_PASSWORD',
        senderName: 'Reset Password - Link Lab',
        to: value.email,
        subject: 'Reset your password',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: value.sessionId,
        },
      });

      this.logger.log(
        `Forgot password OTP resent for ${value.email}`,
        this.context,
      );

      return {
        message: 'A new OTP has been queued successfully.',
        otpExpiresAt: Math.floor(otpExpiresAt) / 1000,
      };
    } catch (error) {
      this.logger.error(
        `Failed to resend forgot password OTP for ${value.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      throw new ForgotPasswordEmailDeliveryException();
    }
  }
  async resetPassword(
    dto: ResetPasswordDto,
    sessionId: string,
    meta?: {
      deviceInfo?: string;
      locationInfo?: string;
    },
  ) {
    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const { value } =
      await this.redisHashService.get<ForgotPasswordSession>(sessionKey);

    if (!value) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    if (new Date(value.expiresAt).getTime() <= Date.now()) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new ForgetPasswordSessionNotFoundException();
    }

    if (!value.isVerified) {
      throw new ForgotPasswordNotVerifiedException();
    }

    if (!value.resetToken) {
      throw new InvalidResetTokenException();
    }

    if (String(value.resetToken) !== String(dto.token)) {
      throw new InvalidResetTokenException();
    }

    if (!value.resetTokenExpiresAt) {
      throw new ResetTokenExpiredException();
    }

    if (new Date(value.resetTokenExpiresAt).getTime() <= Date.now()) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new ResetTokenExpiredException();
    }

    const existingUser = await this.userModel
      .findOne({ email: value.email })
      .select('+password')
      .exec();

    if (!existingUser) {
      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );
      throw new UserNotFoundException();
    }

    const passwordHash = await hashPassword(
      dto.password,
      this.passwordSaltRounds,
    );

    try {
      existingUser.password = passwordHash;
      await existingUser.save();

      await this.clearForgotPasswordState(
        getForgotPasswordLockKey(value.email),
        sessionKey,
      );

      const now = new Date();

      const changeDate = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const changeTime = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const context = buildPasswordChangedEmailContext({
        name: existingUser.name,
        changeDate,
        changeTime,
        deviceInfo: meta?.deviceInfo ?? 'Unknown device',
        locationInfo: meta?.locationInfo ?? 'Unknown location',
        label1: 'Privacy Policy',
        label1Url: `${this.frontendURL}/privacy-policy`,
        label2: 'Help Center',
        label2Url: `${this.frontendURL}/help-center`,
      });
      const html = renderTemplate(PASSWORD_CHANGED_EMAIL_TEMPLATE, context);
      await this.sqsService.sendMail({
        type: 'RESET_PASSWORD',
        senderName: 'Password Changed - Link Lab',
        to: existingUser.email,
        subject: 'Your password has been changed',
        html,
        context,
        meta: {
          source: 'Link Lab',
          requestId: generateSessionId(),
        },
      });

      this.logger.log(
        `Password changed email queued for ${existingUser.email}`,
        this.context,
      );

      this.logger.log(
        `Password reset completed successfully for ${existingUser.email}`,
        this.context,
      );

      return {
        message: 'Password reset successfully.',
        email: existingUser.email,
      };
    } catch (error) {
      this.logger.error(
        `Password reset failed for ${value.email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      throw new InternalServerErrorException({
        message: 'Unable to reset password at this time',
        error: 'Internal Server Error',
      });
    }
  }
  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);

    this.logger.log(`Login request received for ${email}`, this.context);

    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();

    if (!user) {
      this.logger.warn(
        `Login failed: user not found for ${email}`,
        this.context,
      );
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed: invalid password for ${email}`,
        this.context,
      );
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    this.logger.log(`Login successful for ${email}`, this.context);

    return {
      message: 'Login successful.',
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
      },
      accessToken,
      refreshToken,
    };
  }

  logout() {
    this.logger.log('User logged out successfully', this.context);

    return {
      message: 'Logout successful...',
    };
  }

  async refreshAccessToken(refreshToken?: string) {
    if (!refreshToken) {
      throw new RefreshTokenMissingException();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new RefreshTokenInvalidException();
    }

    const user = await this.userModel
      .findOne({
        _id: payload.sub,
        email: payload.email,
      })
      .exec();

    if (!user) {
      throw new RefreshTokenInvalidException();
    }

    const accessToken = await this.generateAccessToken(user);

    this.logger.log(
      `Access token refreshed successfully for ${user.email}`,
      this.context,
    );

    return {
      message: 'Access token refreshed successfully.',
      accessToken,
    };
  }

  async getUser(payload: JwtPayload) {
    const user = await this.userModel
      .findOne({
        _id: payload.sub,
        email: payload.email,
      })
      .lean();

    if (!user) {
      throw new AuthenticatedUserNotFoundException();
    }

    return {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
      },
    };
  }

  private async generateAccessToken(user: UserDocument): Promise<string> {
    return this.jwtService.signAsync<JwtPayload>(
      {
        sub: String(user._id),
        email: user.email,
      },
      {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenTTL as StringValue,
      },
    );
  }

  private async generateRefreshToken(user: UserDocument): Promise<string> {
    return this.jwtService.signAsync<JwtPayload>(
      {
        sub: String(user._id),
        email: user.email,
      },
      {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTTL as StringValue,
      },
    );
  }

  private async clearSignupState(
    lockKey: string,
    sessionKey: string,
  ): Promise<void> {
    try {
      await Promise.all([
        this.redisStringService.delete(lockKey),
        this.redisHashService.delete(sessionKey),
      ]);

      this.logger.log(
        `Signup redis state cleared for ${sessionKey}`,
        this.context,
      );
    } catch (cleanupError) {
      this.logger.error(
        'Failed to cleanup signup state',
        cleanupError instanceof Error
          ? cleanupError.stack
          : String(cleanupError),
        this.context,
      );
    }
  }
  private async clearForgotPasswordState(
    lockKey: string,
    sessionKey: string,
  ): Promise<void> {
    try {
      await Promise.all([
        this.redisStringService.delete(lockKey),
        this.redisHashService.delete(sessionKey),
      ]);

      this.logger.log(
        `Forgot password redis state cleared for ${sessionKey}`,
        this.context,
      );
    } catch (cleanupError) {
      this.logger.error(
        'Failed to cleanup forgot password state',
        cleanupError instanceof Error
          ? cleanupError.stack
          : String(cleanupError),
        this.context,
      );
    }
  }
}

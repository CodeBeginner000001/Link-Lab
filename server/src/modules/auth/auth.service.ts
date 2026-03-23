import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from 'src/common/app.logger';
import {
  EmailDeliveryException,
  InvalidOtpException,
  OtpExpiredException,
  OtpAttemptsExceededException,
  SignupAlreadyInProgressException,
  SignupSessionNotFoundException,
  UserAlreadyExistsException,
} from 'src/exceptions/auth.exception';
import { SignupSession } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import { SqsService } from 'src/services/aws/sqs/sqs.service';
import {
  buildSignupSession,
  generateOtp,
  generateSessionId,
  getMinutesToSeconds,
  hashPassword,
  normalizeEmail,
  normalizeName,
} from 'src/utils/auth.utils';
import { renderTemplate } from 'src/utils/email.utils';
import {
  getSignupLockKey,
  getSignupSessionKey,
} from 'src/utils/redis-key.utils';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { SignupDto, VerifyOtpDto } from './dto/signup.dto';
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
  private readonly frontendURL: string;
  private readonly otpLength = 6;
  private readonly passwordSaltRounds = 12;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisHashService: RedisHashService,
    private readonly redisStringService: RedisStringService,
    private readonly sqsService: SqsService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.otpAttempts = this.configService.get<number>('OTP_ATTEMPTS', 3);
    this.maxOtpResendAttempts = this.configService.get<number>(
      'MAX_OTP_RESEND_ATTEMPTS',
      5,
    );
    this.resendCooldownSeconds = this.configService.get<number>(
      'RESEND_COOLDOWN_SECOND',
      60,
    );
    this.otpExpirationMinutes = this.configService.get<number>(
      'OTP_EXPIRATION_MINUTES',
      5,
    );
    this.signupSessionTtlMinutes = this.configService.get<number>(
      'SIGNUP_SESSION_TTL_MINUTES',
      5,
    );
    this.frontendURL = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
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
        message: 'Signup successful. Verification OTP has been sent.',
        email,
        sessionId,
        expiresInMinutes: this.otpExpirationMinutes,
        signupSessionExpiresInMinutes: this.signupSessionTtlMinutes,
      };
    } catch (error) {
      await this.clearSignupState(lockKey, sessionKey);

      this.logger.error(
        `Signup flow failed for ${email}`,
        error instanceof Error ? error.stack : String(error),
        this.context,
      );

      if (error instanceof InternalServerErrorException) {
        throw new EmailDeliveryException();
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
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        avatar: createdUser.avatar ?? null,
      },
    };
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
}

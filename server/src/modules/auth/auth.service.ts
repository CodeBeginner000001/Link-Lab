import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from 'src/common/app.logger';
import { RedisService } from 'src/common/db/redis.service';
import {
  EmailDeliveryException,
  SignupAlreadyInProgressException,
  UserAlreadyExistsException,
} from 'src/exceptions/auth.exception';
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
import { RedisHashService } from '../redis/redis-hash.service';
import { SignupDto } from './dto/signup.dto';
import {
  getSignupLockKey,
  getSignupSessionKey,
} from 'src/utils/redis-key.utils';
import { RedisStringService } from '../redis/redis-string.service';
import {
  buildVerifyEmailContext,
  VERIFY_EMAIL_TEMPLATE,
} from './template/verify-email.templates';

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  private readonly otpAttempts = Number(process.env.OTP_ATTEMPTS ?? 5);
  private readonly maxOtpResendAttempts = Number(
    process.env.MAX_OTP_RESEND_ATTEMPTS ?? 5,
  );
  private readonly resendCooldownSeconds = Number(
    process.env.RESEND_COOLDOWN ?? 5,
  );
  private readonly otpExpirationMinutes = Number(
    process.env.OTP_EXPIRATION ?? 1,
  );
  private readonly signupSessionTtlMinutes = Number(
    process.env.SIGNUP_SESSION_TTL ?? 5,
  );
  private readonly otpLength = 6;
  private readonly passwordSaltRounds = 12;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisHashService: RedisHashService,
    private readonly redisStringService: RedisStringService,
    private readonly redisService: RedisService,
    private readonly sqsService: SqsService,
    private readonly logger: AppLogger,
  ) {}
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
    const sessionKey = getSignupSessionKey(email);
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
      });

      await this.redisHashService.create(
        sessionKey,
        signupSession,
        sessionTtlSeconds,
      );
      await this.sqsService.sendMail({
        type: 'VERIFY_EMAIL',
        to: email,
        subject: 'Verify your email address',
        html: VERIFY_EMAIL_TEMPLATE,
        context: buildVerifyEmailContext(name, otp, this.otpExpirationMinutes),
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

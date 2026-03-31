import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  InvalidOtpException,
  OtpAttemptsExceededException,
  OtpExpiredException,
  ResendAttemptsExceededException,
  ResendOtpCooldownException,
  SignupAlreadyInProgressException,
  SignupSessionNotFoundException,
  UserAlreadyExistsException,
} from 'src/exceptions/auth.exception';
import { SignupSession } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import {
  buildSignupSession,
  generateOtp,
  generateSessionId,
  getMinutesToSeconds,
  hashPassword,
  normalizeEmail,
  normalizeName,
} from 'src/utils/auth.utils';
import {
  getSignupLockKey,
  getSignupSessionKey,
} from 'src/utils/redis-key.utils';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { AuthFlowConfigService } from './auth-config.service';
import { NotificationService } from './notification.service';
import { SignupDto, VerifyOtpDto } from './dto/signup.dto';
import { TokenService } from './token.service';

@Injectable()
export class SignupFlowService {
  private readonly otpLength = 6;
  private readonly passwordSaltRounds = 12;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly redisHashService: RedisHashService,
    private readonly redisStringService: RedisStringService,
    private readonly notificationService: NotificationService,
    private readonly tokenService: TokenService,
    private readonly flowConfig: AuthFlowConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const email = normalizeEmail(dto.email);
    const name = normalizeName(dto.name);

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const sessionId = generateSessionId();
    const lockKey = getSignupLockKey(email);
    const sessionKey = getSignupSessionKey(sessionId);
    const ttlSeconds = getMinutesToSeconds(
      this.flowConfig.signupSessionTtlMinutes,
    );

    const lock = await this.redisStringService.createIfNotExists(
      lockKey,
      sessionId,
      ttlSeconds,
    );

    if (!lock.created) {
      throw new SignupAlreadyInProgressException();
    }

    try {
      const otp = generateOtp(this.otpLength);
      const passwordHash = await hashPassword(
        dto.password,
        this.passwordSaltRounds,
      );

      const session = buildSignupSession({
        sessionId,
        name,
        email,
        passwordHash,
        otp,
        otpAttemptsLeft: this.flowConfig.otpAttempts,
        resendAttemptsLeft: this.flowConfig.maxOtpResendAttempts,
        resendCooldownSeconds: this.flowConfig.resendCooldownSeconds,
        otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
        signupSessionTtlMinutes: this.flowConfig.signupSessionTtlMinutes,
      });

      await this.redisHashService.create(sessionKey, session, ttlSeconds);

      await this.notificationService.queueSignupOtp({
        email,
        name,
        otp,
        otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
        requestId: sessionId,
      });

      return {
        message: 'Signup initiated. Please verify OTP.',
        sessionId,
        signupSessionExpiresInMinutes: this.flowConfig.signupSessionTtlMinutes,
      };
    } catch (error) {
      await this.clearSignupState(email, sessionKey);
      this.rethrowAsHttpException(error, 'Unable to process signup request');
    }
  }

  async verifySignupOtp(dto: VerifyOtpDto, sessionId: string) {
    const { sessionKey, session } =
      await this.getSignupSessionOrThrow(sessionId);

    if (new Date(session.otpExpiresAt).getTime() <= Date.now()) {
      throw new OtpExpiredException();
    }

    if ((session.otpAttemptsLeft ?? 0) <= 0) {
      await this.clearSignupState(session.email, sessionKey);
      throw new OtpAttemptsExceededException();
    }

    if (String(session.otp) !== String(dto.otp)) {
      const attemptsLeft = Math.max((session.otpAttemptsLeft ?? 0) - 1, 0);

      await this.redisHashService.updateFields<SignupSession>(
        sessionKey,
        { otpAttemptsLeft: attemptsLeft },
        undefined,
        true,
      );

      if (attemptsLeft <= 0) {
        await this.clearSignupState(session.email, sessionKey);
        throw new OtpAttemptsExceededException();
      }

      throw new InvalidOtpException(attemptsLeft);
    }

    const existingUser = await this.userModel
      .findOne({ email: session.email })
      .lean();
    if (existingUser) {
      await this.clearSignupState(session.email, sessionKey);
      throw new UserAlreadyExistsException();
    }

    const createdUser = await this.userModel.create({
      name: session.name,
      email: session.email,
      password: session.passwordHash,
    });

    await this.clearSignupState(session.email, sessionKey);

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken({
        id: String(createdUser._id),
        email: createdUser.email,
      }),
      this.tokenService.createRefreshToken({
        id: String(createdUser._id),
        email: createdUser.email,
      }),
    ]);

    void this.notificationService.queueWelcomeEmail({
      email: createdUser.email,
      name: createdUser.name,
      requestId: session.sessionId,
      frontendUrl: this.flowConfig.frontendURL,
    });

    return {
      message: 'Email verified successfully.',
      accessToken,
      refreshToken,
    };
  }

  async resendSignupOtp(sessionId: string) {
    const { sessionKey, session } =
      await this.getSignupSessionOrThrow(sessionId);

    if ((session.resendAttemptsLeft ?? 0) <= 0) {
      await this.clearSignupState(session.email, sessionKey);
      throw new ResendAttemptsExceededException();
    }

    if (session.lastResendAttemptAt) {
      const nextAllowedAt =
        new Date(session.lastResendAttemptAt).getTime() +
        (session.resendCooldownSeconds ??
          this.flowConfig.resendCooldownSeconds) *
          1000;

      if (Date.now() < nextAllowedAt) {
        throw new ResendOtpCooldownException(
          Math.ceil((nextAllowedAt - Date.now()) / 1000),
        );
      }
    }

    const otp = generateOtp(this.otpLength);
    const otpExpiresAt = new Date(
      Date.now() + this.flowConfig.otpExpirationMinutes * 60 * 1000,
    ).toISOString();

    await this.redisHashService.updateFields<SignupSession>(
      sessionKey,
      {
        otp,
        otpExpiresAt,
        resendAttemptsLeft: Math.max((session.resendAttemptsLeft ?? 0) - 1, 0),
        lastResendAttemptAt: new Date().toISOString(),
      },
      undefined,
      true,
    );

    await this.notificationService.queueSignupOtp({
      email: session.email,
      name: session.name,
      otp,
      otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
      requestId: session.sessionId,
    });

    return {
      message: 'A new verification OTP has been sent.',
      otpExpiresAt: Math.floor(new Date(otpExpiresAt).getTime() / 1000),
    };
  }

  async getSignupSessionDetail(sessionId: string) {
    const { session } = await this.getSignupSessionOrThrow(sessionId);

    return {
      email: session.email,
      otpExpiresAt: Math.max(
        0,
        Math.floor(
          (new Date(session.otpExpiresAt).getTime() - Date.now()) / 1000,
        ),
      ),
    };
  }

  private async getSignupSessionOrThrow(sessionId: string) {
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

    return {
      sessionKey,
      session: value,
    };
  }

  private async clearSignupState(
    email: string,
    sessionKey: string,
  ): Promise<void> {
    await Promise.all([
      this.redisStringService.delete(getSignupLockKey(email)),
      this.redisHashService.delete(sessionKey),
    ]);
  }

  private rethrowAsHttpException(error: unknown, message: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException({
      message,
      error: 'Internal Server Error',
    });
  }
}

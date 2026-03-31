import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ForgetPasswordSessionNotFoundException,
  ForgotPasswordAlreadyInProgressException,
  ForgotPasswordNotVerifiedException,
  InvalidOtpException,
  InvalidResetTokenException,
  OtpAttemptsExceededException,
  OtpExpiredException,
  ResendAttemptsExceededException,
  ResendOtpCooldownException,
  ResetTokenExpiredException,
  UserNotFoundException,
} from 'src/exceptions/auth.exception';
import { ForgotPasswordSession } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import {
  buildForgotPasswordSession,
  generateOtp,
  generateSessionId,
  getMinutesToSeconds,
  hashPassword,
  normalizeEmail,
} from 'src/utils/auth.utils';
import {
  getForgotPasswordLockKey,
  getForgotPasswordSessionKey,
} from 'src/utils/redis-key.utils';
import { RedisHashService } from '../redis/redis-hash.service';
import { RedisStringService } from '../redis/redis-string.service';
import { AuthFlowConfigService } from './auth-config.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordTokenDto,
} from './dto/forget-password.dto';
import { VerifyOtpDto } from './dto/signup.dto';
import { NotificationService } from './notification.service';
import { TokenService } from './token.service';

@Injectable()
export class ForgotPasswordFlowService {
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = normalizeEmail(dto.email);
    const existingUser = await this.userModel.findOne({ email }).lean();

    if (!existingUser) {
      throw new UserNotFoundException();
    }

    const sessionId = generateSessionId();
    const lockKey = getForgotPasswordLockKey(email);
    const sessionKey = getForgotPasswordSessionKey(sessionId);
    const ttlSeconds = getMinutesToSeconds(
      this.flowConfig.forgotPasswordTtlMinutes,
    );

    const lock = await this.redisStringService.createIfNotExists(
      lockKey,
      sessionId,
      ttlSeconds,
    );

    if (!lock.created) {
      throw new ForgotPasswordAlreadyInProgressException();
    }

    try {
      const otp = generateOtp(this.otpLength);

      const session = buildForgotPasswordSession({
        sessionId,
        email,
        otp,
        otpAttemptsLeft: this.flowConfig.otpAttempts,
        resendAttemptsLeft: this.flowConfig.maxOtpResendAttempts,
        resendCooldownSeconds: this.flowConfig.resendCooldownSeconds,
        otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
        forgotPasswordTtlMinutes: this.flowConfig.forgotPasswordTtlMinutes,
      });

      await this.redisHashService.create(sessionKey, session, ttlSeconds);

      await this.notificationService.queueForgotPasswordOtp({
        email,
        name: existingUser.name,
        otp,
        otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
        requestId: sessionId,
        frontendUrl: this.flowConfig.frontendURL,
      });

      return {
        sessionId,
        message: 'Password reset verification email has been sent.',
        forgotPasswordSessionExpiresInMinutes:
          this.flowConfig.forgotPasswordTtlMinutes,
      };
    } catch (error) {
      await this.clearForgotPasswordState(email, sessionKey);
      this.rethrowAsHttpException(
        error,
        'Unable to process forgot password request',
      );
    }
  }

  async getForgotPasswordSessionDetail(sessionId: string) {
    const { session } = await this.getForgotPasswordSessionOrThrow(sessionId);

    return {
      email: session.email,
      otpExpiresAt: Math.max(
        0,
        Math.ceil(
          (new Date(session.otpExpiresAt).getTime() - Date.now()) / 1000,
        ),
      ),
    };
  }

  async verifyForgotPasswordOtp(dto: VerifyOtpDto, sessionId: string) {
    const { sessionKey, session } =
      await this.getForgotPasswordSessionOrThrow(sessionId);

    if (new Date(session.otpExpiresAt).getTime() <= Date.now()) {
      throw new OtpExpiredException();
    }

    if ((session.otpAttemptsLeft ?? 0) <= 0) {
      await this.clearForgotPasswordState(session.email, sessionKey);
      throw new OtpAttemptsExceededException();
    }

    if (String(session.otp) !== String(dto.otp)) {
      const attemptsLeft = Math.max((session.otpAttemptsLeft ?? 0) - 1, 0);

      await this.redisHashService.updateFields<ForgotPasswordSession>(
        sessionKey,
        { otpAttemptsLeft: attemptsLeft },
        undefined,
        true,
      );

      if (attemptsLeft <= 0) {
        await this.clearForgotPasswordState(session.email, sessionKey);
        throw new OtpAttemptsExceededException();
      }

      throw new InvalidOtpException(attemptsLeft);
    }

    const existingUser = await this.userModel
      .findOne({ email: session.email })
      .lean();
    if (!existingUser) {
      await this.clearForgotPasswordState(session.email, sessionKey);
      throw new UserNotFoundException();
    }

    const resetToken = this.tokenService.createResetToken(session.sessionId);
    const resetTokenExpiresAt = new Date(
      Date.now() + this.flowConfig.resetLinkExpirationMinutes * 60 * 1000,
    ).toISOString();

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

    await this.notificationService.queueResetPasswordLink({
      email: session.email,
      name: existingUser.name,
      resetToken,
      expiresInMinutes: this.flowConfig.resetLinkExpirationMinutes,
      requestId: session.sessionId,
      frontendUrl: this.flowConfig.frontendURL,
    });

    return {
      message:
        'OTP verified successfully. Reset link has been sent to your email.',
      resetTokenExpiresInMinutes: this.flowConfig.resetLinkExpirationMinutes,
    };
  }

  async resendForgotPasswordOtp(sessionId: string) {
    const { sessionKey, session } =
      await this.getForgotPasswordSessionOrThrow(sessionId);

    if ((session.resendAttemptsLeft ?? 0) <= 0) {
      await this.clearForgotPasswordState(session.email, sessionKey);
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

    const existingUser = await this.userModel
      .findOne({ email: session.email })
      .lean();
    if (!existingUser) {
      await this.clearForgotPasswordState(session.email, sessionKey);
      throw new UserNotFoundException();
    }

    const otp = generateOtp(this.otpLength);
    const otpExpiresAt = new Date(
      Date.now() + this.flowConfig.otpExpirationMinutes * 60 * 1000,
    ).toISOString();

    await this.redisHashService.updateFields<ForgotPasswordSession>(
      sessionKey,
      {
        otp,
        otpExpiresAt,
        resendAttemptsLeft: Math.max((session.resendAttemptsLeft ?? 0) - 1, 0),
        lastResendAttemptAt: new Date().toISOString(),
        isVerified: false,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
      undefined,
      true,
    );

    await this.notificationService.queueForgotPasswordOtp({
      email: session.email,
      name: existingUser.name,
      otp,
      otpExpirationMinutes: this.flowConfig.otpExpirationMinutes,
      requestId: session.sessionId,
      frontendUrl: this.flowConfig.frontendURL,
    });

    return {
      message: 'A new OTP has been sent successfully.',
      otpExpiresAt: Math.floor(new Date(otpExpiresAt).getTime() / 1000),
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    meta?: {
      deviceInfo?: string;
      locationInfo?: string;
    },
  ) {
    const { sessionKey, session, user } = await this.getValidResetContext(
      dto.token,
    );

    user.password = await hashPassword(dto.password, this.passwordSaltRounds);
    await user.save();
    await this.clearForgotPasswordState(session.email, sessionKey);

    void this.notificationService.queuePasswordChangedEmail({
      email: user.email,
      name: user.name,
      changedAt: new Date(),
      deviceInfo: meta?.deviceInfo ?? 'Unknown device',
      locationInfo: meta?.locationInfo ?? 'Unknown location',
      frontendUrl: this.flowConfig.frontendURL,
    });

    return {
      message: 'Password reset successfully.',
      email: user.email,
    };
  }

  async validateResetPasswordToken(dto: ResetPasswordTokenDto) {
    const { session } = await this.getValidResetContext(dto.token);

    return {
      message: 'Reset token is valid.',
      email: session.email,
      expiresAt: session.resetTokenExpiresAt,
    };
  }

  private async getForgotPasswordSessionOrThrow(sessionId: string) {
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

    return {
      sessionKey,
      session: value,
    };
  }

  private async clearForgotPasswordState(
    email: string,
    sessionKey: string,
  ): Promise<void> {
    await Promise.all([
      this.redisStringService.delete(getForgotPasswordLockKey(email)),
      this.redisHashService.delete(sessionKey),
    ]);
  }

  private async getValidResetContext(token: string) {
    const sessionId = this.tokenService.decodeResetToken(token);
    const { sessionKey, session } =
      await this.getForgotPasswordSessionOrThrow(sessionId);

    if (!session.isVerified) {
      throw new ForgotPasswordNotVerifiedException();
    }

    if (!session.resetToken || String(session.resetToken) !== String(token)) {
      throw new InvalidResetTokenException();
    }

    if (!session.resetTokenExpiresAt) {
      throw new ResetTokenExpiredException();
    }

    if (new Date(session.resetTokenExpiresAt).getTime() <= Date.now()) {
      await this.clearForgotPasswordState(session.email, sessionKey);
      throw new ResetTokenExpiredException();
    }

    const user = await this.userModel
      .findOne({ email: session.email })
      .select('+password')
      .exec();

    if (!user) {
      await this.clearForgotPasswordState(session.email, sessionKey);
      throw new UserNotFoundException();
    }

    return {
      sessionKey,
      session,
      user,
    };
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

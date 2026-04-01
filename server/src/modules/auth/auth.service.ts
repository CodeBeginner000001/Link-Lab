import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from 'src/common/app.logger';
import {
  AuthenticatedUserNotFoundException,
  InvalidCredentialsException,
  RefreshTokenInvalidException,
  UserAlreadyExistsException,
} from 'src/exceptions/auth.exception';
import {
  GithubAccountConflictException,
  GithubPasswordLoginUnavailableException,
  InvalidGithubAccountException,
} from 'src/exceptions/oauth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import {
  comparePassword,
  normalizeEmail,
  normalizeName,
} from 'src/utils/auth.utils';
import { AuthFlowConfigService } from './auth-config.service';
import { LoginDto } from './dto/signup.dto';
import { NotificationService } from './notification.service';
import { TokenService } from './token.service';
import { GithubExchangeDto } from './dto/OAuth.dto';

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly tokenService: TokenService,
    private readonly notificationService: NotificationService,
    private readonly flowConfig: AuthFlowConfigService,
    private readonly logger: AppLogger,
  ) {}

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

    if (!user.password) {
      this.logger.warn(
        `Login failed: password login unavailable for ${email}`,
        this.context,
      );
      throw new GithubPasswordLoginUnavailableException();
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed: invalid password for ${email}`,
        this.context,
      );
      throw new InvalidCredentialsException();
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken({
        id: String(user._id),
        email: user.email,
      }),
      this.tokenService.createRefreshToken({
        id: String(user._id),
        email: user.email,
      }),
    ]);

    user.lastLoginAt = new Date();
    await user.save();

    this.logger.log(`Login successful for ${email}`, this.context);

    return {
      message: 'Login successful.',
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        provider: user.provider ?? 'local',
        providerUserId: user.providerUserId ?? null,
        isEmailVerified: user.isEmailVerified ?? false,
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
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userModel
      .findOne({
        _id: payload.sub,
        email: payload.email,
      })
      .exec();

    if (!user) {
      throw new RefreshTokenInvalidException();
    }

    const accessToken = await this.tokenService.createAccessToken({
      id: String(user._id),
      email: user.email,
    });

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
        provider: user.provider ?? 'local',
        providerUserId: user.providerUserId ?? null,
        isEmailVerified: user.isEmailVerified ?? false,
      },
    };
  }
  async githubExchange(dto: GithubExchangeDto) {
    const email = dto.email.trim().toLowerCase();
    const providerUserId = dto.providerUserId?.trim();
    const name = dto.name?.trim()
      ? normalizeName(dto.name)
      : email.split('@')[0];
    const avatar = dto.avatar?.trim() || undefined;
    const currentLoginAt = new Date();

    if (!email || !providerUserId) {
      throw new InvalidGithubAccountException();
    }

    const [existingGithubUser, existingEmailUser] = await Promise.all([
      this.userModel
        .findOne({
          provider: 'github',
          providerUserId,
        })
        .exec(),
      this.userModel.findOne({ email }).exec(),
    ]);

    if (
      existingGithubUser &&
      existingEmailUser &&
      String(existingGithubUser._id) !== String(existingEmailUser._id)
    ) {
      if (existingEmailUser.provider !== 'github') {
        throw new UserAlreadyExistsException();
      }

      throw new GithubAccountConflictException();
    }

    let user = existingGithubUser ?? existingEmailUser;

    if (user && user.provider !== 'github') {
      throw new UserAlreadyExistsException();
    }

    if (!user) {
      user = await this.userModel.create({
        email,
        name,
        avatar,
        provider: 'github',
        providerUserId,
        isEmailVerified: true,
        lastLoginAt: currentLoginAt,
      });

      await this.notificationService.queueWelcomeEmail({
        email: user.email,
        name: user.name,
        requestId: providerUserId,
        frontendUrl: this.flowConfig.frontendURL,
      });
    } else {
      if (
        user.provider === 'github' &&
        user.providerUserId &&
        user.providerUserId !== providerUserId
      ) {
        throw new GithubAccountConflictException();
      }

      user.email = email;
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      user.provider = 'github';
      user.providerUserId = providerUserId;
      user.isEmailVerified = true;
      user.lastLoginAt = currentLoginAt;
      await user.save();
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken({
        id: String(user._id),
        email: user.email,
      }),
      this.tokenService.createRefreshToken({
        id: String(user._id),
        email: user.email,
      }),
    ]);

    return {
      success: true,
      message: 'GitHub authentication successful.',
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        avatar: user.avatar ?? null,
        provider: user.provider ?? 'github',
        providerUserId: user.providerUserId ?? null,
        isEmailVerified: user.isEmailVerified ?? false,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppLogger } from 'src/common/app.logger';
import {
  AuthenticatedUserNotFoundException,
  InvalidCredentialsException,
  RefreshTokenInvalidException,
} from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { User, UserDocument } from 'src/models/user.schema';
import { comparePassword, normalizeEmail } from 'src/utils/auth.utils';
import { LoginDto } from './dto/signup.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly context = AuthService.name;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly tokenService: TokenService,
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
      },
    };
  }
}

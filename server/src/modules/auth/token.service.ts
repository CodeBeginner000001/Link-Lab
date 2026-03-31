import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import {
  InvalidResetTokenException,
  RefreshTokenInvalidException,
  RefreshTokenMissingException,
} from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { decrypt, encrypt } from 'src/utils/auth.utils';

export interface TokenIdentity {
  id: string;
  email: string;
}

@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly resetTokenSecret: string;
  private readonly accessTokenTTL: string;
  private readonly refreshTokenTTL: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.accessTokenSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshTokenSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.resetTokenSecret =
      this.configService.get<string>('RESET_TOKEN_SECRET') ??
      this.accessTokenSecret;
    this.accessTokenTTL = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    this.refreshTokenTTL = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
  }

  async createAccessToken(identity: TokenIdentity): Promise<string> {
    try {
      return await this.jwtService.signAsync<JwtPayload>(
        {
          sub: identity.id,
          email: identity.email,
        },
        {
          secret: this.accessTokenSecret,
          expiresIn: this.accessTokenTTL as StringValue,
        },
      );
    } catch {
      throw new InternalServerErrorException({
        message: 'Unable to generate access token',
        error: 'Internal Server Error',
      });
    }
  }

  async createRefreshToken(identity: TokenIdentity): Promise<string> {
    try {
      return await this.jwtService.signAsync<JwtPayload>(
        {
          sub: identity.id,
          email: identity.email,
        },
        {
          secret: this.refreshTokenSecret,
          expiresIn: this.refreshTokenTTL as StringValue,
        },
      );
    } catch {
      throw new InternalServerErrorException({
        message: 'Unable to generate refresh token',
        error: 'Internal Server Error',
      });
    }
  }

  async verifyRefreshToken(refreshToken?: string): Promise<JwtPayload> {
    if (!refreshToken) {
      throw new RefreshTokenMissingException();
    }

    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new RefreshTokenInvalidException();
    }
  }

  createResetToken(sessionId: string): string {
    try {
      return encrypt(sessionId, this.resetTokenSecret);
    } catch {
      throw new InternalServerErrorException({
        message: 'Unable to generate reset token',
        error: 'Internal Server Error',
      });
    }
  }

  decodeResetToken(token: string): string {
    try {
      return decrypt(decodeURIComponent(token), this.resetTokenSecret);
    } catch {
      throw new InvalidResetTokenException();
    }
  }
}

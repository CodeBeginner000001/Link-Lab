import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { Public } from 'src/decorators/public.decorator';
import {
  AccessTokenExpired,
  ForgetPasswordSessionNotFoundException,
  RefreshTokenMissingException,
  ResendAttemptsExceededException,
  SignupSessionNotFoundException,
} from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginDto, SignupDto, VerifyOtpDto } from './dto/signup.dto';

function getCookieValue(req: express.Request, key: string): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[key];

  return typeof value === 'string' ? value : undefined;
}

function getCookieMaxAge(duration?: string): number | undefined {
  if (!duration) {
    return undefined;
  }

  const match = duration.trim().match(/^(\d+)(ms|s|m|h|d)$/i);

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

function isProductionEnv(): boolean {
  return process.env.ENV === 'prod';
}

function buildCookieOptions(maxAge?: number): express.CookieOptions {
  return {
    httpOnly: true,
    secure: isProductionEnv(),
    sameSite: isProductionEnv() ? 'none' : 'lax',
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

function clearSessionCookie(
  res: express.Response,
  key: 'signup_session' | 'forgot_password_session',
): void {
  res.clearCookie(key, buildCookieOptions());
}

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('signup')
  async signup(
    // done integration
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.signup(dto);

    res.cookie(
      'signup_session',
      result.sessionId,
      buildCookieOptions(result.signupSessionExpiresInMinutes * 60 * 1000),
    );

    return {
      message: result.message,
    };
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    // done integration
    @Body() dto: VerifyOtpDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(
      process.env.JWT_ACCESS_EXPIRES_IN,
    );
    const refreshTokenMaxAge = getCookieMaxAge(
      process.env.JWT_REFRESH_EXPIRES_IN,
    );
    const sessionId = getCookieValue(req, 'signup_session');

    if (!sessionId) {
      clearSessionCookie(res, 'signup_session');
      throw new SignupSessionNotFoundException();
    }

    const result = await this.authService.verifySignupOtp(dto, sessionId);

    res.clearCookie('signup_session', buildCookieOptions());
    res.cookie(
      'access_token',
      result.accessToken,
      buildCookieOptions(accessTokenMaxAge),
    );

    res.cookie(
      'refresh_token',
      result.refreshToken,
      buildCookieOptions(refreshTokenMaxAge),
    );

    return result;
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(
    // done integration
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = getCookieValue(req, 'signup_session');

    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }

    try {
      return await this.authService.resendSignupOtp(sessionId);
    } catch (error) {
      if (error instanceof ResendAttemptsExceededException) {
        clearSessionCookie(res, 'signup_session');
      }

      throw error;
    }
  }

  @Public()
  @Get('signup/session')
  async getSessionDetail(
    // done integration
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = getCookieValue(req, 'signup_session');

    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }
    try {
      return await this.authService.getSessionDetail(sessionId);
    } catch (error) {
      if (error instanceof SignupSessionNotFoundException) {
        clearSessionCookie(res, 'signup_session');
      }
      if (error instanceof ResendAttemptsExceededException) {
        clearSessionCookie(res, 'signup_session');
      }

      throw error;
    }
  }

  @Post('getUser')
  async getUser(@Req() req: express.Request & { user?: JwtPayload }) {
    // done integration
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.authService.getUser(req.user);
  }

  @Post('refresh-token')
  @Public()
  async refreshToken(
    // done integration
    @Body() dto: RefreshTokenDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(
      process.env.JWT_ACCESS_EXPIRES_IN,
    );
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookieRefreshToken =
      typeof cookies?.refresh_token === 'string'
        ? cookies.refresh_token
        : undefined;

    const refreshToken = cookieRefreshToken ?? dto.refreshToken;

    if (!refreshToken) {
      throw new RefreshTokenMissingException();
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    res.cookie(
      'access_token',
      result.accessToken,
      buildCookieOptions(accessTokenMaxAge),
    );

    return result;
  }

  @Public()
  @Post('login')
  async login(
    // done integration
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(
      process.env.JWT_ACCESS_EXPIRES_IN,
    );
    const refreshTokenMaxAge = getCookieMaxAge(
      process.env.JWT_REFRESH_EXPIRES_IN,
    );
    const result = await this.authService.login(dto);

    res.cookie(
      'access_token',
      result.accessToken,
      buildCookieOptions(accessTokenMaxAge),
    );

    res.cookie(
      'refresh_token',
      result.refreshToken,
      buildCookieOptions(refreshTokenMaxAge),
    );

    return {
      message: result.message,
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    // done integration
    res.clearCookie('access_token', buildCookieOptions());
    res.clearCookie('refresh_token', buildCookieOptions());
    res.clearCookie('signup_session', buildCookieOptions());
    res.clearCookie('forgot_password_session', buildCookieOptions());

    return this.authService.logout();
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    // gone integration
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.forgotPassword(dto);

    res.cookie(
      'forgot_password_session',
      result.sessionId,
      buildCookieOptions(
        result.forgotPasswordSessionExpiresInMinutes * 60 * 1000,
      ),
    );

    return {
      message: result.message,
    };
  }

  @Public()
  @Get('forget-password/session')
  async getForgetPasswordSessionDetail(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = getCookieValue(req, 'forgot_password_session');

    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }
    try {
      return await this.authService.getForgetPasswordSessionDetail(sessionId);
    } catch (error) {
      if (error instanceof ForgetPasswordSessionNotFoundException) {
        clearSessionCookie(res, 'forgot_password_session');
      }
      throw error;
    }
  }

  @Post('forgot-password/verify-otp')
  @Public()
  async verifyForgotPasswordOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = getCookieValue(req, 'forgot_password_session');

    if (!sessionId) {
      clearSessionCookie(res, 'forgot_password_session');
      throw new ForgetPasswordSessionNotFoundException();
    }

    return this.authService.verifyForgotPasswordOtp(dto, sessionId);
  }

  @Post('forgot-password/resend-otp')
  @Public()
  async resendForgotPasswordOtp(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const sessionId = getCookieValue(req, 'forgot_password_session');

    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    try {
      return await this.authService.resendForgotPasswordOtp(sessionId);
    } catch (error) {
      if (error instanceof ResendAttemptsExceededException) {
        clearSessionCookie(res, 'forgot_password_session');
      }

      throw error;
    }
  }

  @Post('forgot-password/reset-password')
  @Public()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const sessionId =
      typeof cookies?.forgot_password_session === 'string'
        ? cookies.forgot_password_session
        : undefined;

    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    const result = await this.authService.resetPassword(dto, sessionId, {
      deviceInfo: req.get('user-agent') ?? 'Unknown device',
      locationInfo: req.ip ?? 'Unknown location',
    });

    res.clearCookie('forgot_password_session', buildCookieOptions());

    return result;
  }
}

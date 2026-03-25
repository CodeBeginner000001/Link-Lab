import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { Public } from 'src/decorators/public.decorator';
import {
  ForgetPasswordSessionNotFoundException,
  RefreshTokenMissingException,
  SignupSessionNotFoundException,
} from 'src/exceptions/auth.exception';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { LoginDto, SignupDto, VerifyOtpDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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

function buildAuthCookieOptions(maxAge?: number): express.CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.ENV !== 'dev',
    sameSite: 'lax',
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.signup(dto);

    res.cookie('signup_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.ENV !== 'dev',
      sameSite: 'lax',
      maxAge: result.signupSessionExpiresInMinutes * 60 * 1000,
      path: '/',
    });

    return {
      message: result.message,
      email: result.email,
      expiresInMinutes: result.expiresInMinutes,
      resendCooldownSeconds: result.resendCooldownSeconds,
      signupSessionExpiresInMinutes: result.signupSessionExpiresInMinutes,
    };
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(process.env.JWT_ACCESS_EXPIRES_IN);
    const refreshTokenMaxAge = getCookieMaxAge(
      process.env.JWT_REFRESH_EXPIRES_IN,
    );
    const sessionId = getCookieValue(req, 'signup_session');

    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }

    const result = await this.authService.verifySignupOtp(dto, sessionId);

    res.clearCookie('signup_session', {
      httpOnly: true,
      secure: process.env.ENV !== 'dev',
      sameSite: 'lax',
      path: '/',
    });
    res.cookie(
      'access_token',
      result.accessToken,
      buildAuthCookieOptions(accessTokenMaxAge),
    );

    res.cookie(
      'refresh_token',
      result.refreshToken,
      buildAuthCookieOptions(refreshTokenMaxAge),
    );

    return result;
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Req() req: express.Request) {
    const sessionId = getCookieValue(req, 'signup_session');

    if (!sessionId) {
      throw new SignupSessionNotFoundException();
    }

    return this.authService.resendSignupOtp(sessionId);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.forgotPassword(dto);

    res.cookie('forgot_password_session', result.sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: result.forgotPasswordSessionExpiresInMinutes * 60 * 1000,
      path: '/',
    });

    return {
      message: result.message,
      email: result.email,
      expiresInMinutes: result.expiresInMinutes,
      resendCooldownSeconds: result.resendCooldownSeconds,
      forgotPasswordSessionExpiresInMinutes:
        result.forgotPasswordSessionExpiresInMinutes,
    };
  }

  @Post('forgot-password/verify-otp')
  @Public()
  async verifyForgotPasswordOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: express.Request,
  ) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const sessionId =
      typeof cookies?.forgot_password_session === 'string'
        ? cookies.forgot_password_session
        : undefined;

    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    return this.authService.verifyForgotPasswordOtp(dto, sessionId);
  }

  @Post('forgot-password/resend-otp')
  @Public()
  async resendForgotPasswordOtp(@Req() req: express.Request) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const sessionId =
      typeof cookies?.forgot_password_session === 'string'
        ? cookies.forgot_password_session
        : undefined;

    if (!sessionId) {
      throw new ForgetPasswordSessionNotFoundException();
    }

    return this.authService.resendForgotPasswordOtp(sessionId);
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

    res.clearCookie('forgot_password_session', {
      httpOnly: true,
      secure: process.env.ENV !== 'dev',
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }
  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(process.env.JWT_ACCESS_EXPIRES_IN);
    const refreshTokenMaxAge = getCookieMaxAge(
      process.env.JWT_REFRESH_EXPIRES_IN,
    );
    const result = await this.authService.login(dto);

    res.cookie(
      'access_token',
      result.accessToken,
      buildAuthCookieOptions(accessTokenMaxAge),
    );

    res.cookie(
      'refresh_token',
      result.refreshToken,
      buildAuthCookieOptions(refreshTokenMaxAge),
    );

    return {
      message: result.message,
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    const secure = process.env.ENV !== 'dev';

    res.clearCookie('access_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('signup_session', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('forgot_password_session', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    return this.authService.logout();
  }

  @Post('refresh-token')
  @Public()
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const accessTokenMaxAge = getCookieMaxAge(process.env.JWT_ACCESS_EXPIRES_IN);
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
      buildAuthCookieOptions(accessTokenMaxAge),
    );

    return result;
  }
}

import { Body, Controller, Post, Req, Res } from '@nestjs/common';
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
import {
  AuthFlowDto,
  AuthFlowName,
  RefreshTokenDto,
} from './dto/auth-flow.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordTokenDto,
} from './dto/forget-password.dto';
import { LoginDto, SignupDto, VerifyOtpDto } from './dto/signup.dto';
import { SignupFlowService } from './signup-flow.service';
import { ForgotPasswordFlowService } from './forget-password-flow.service';

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
  constructor(
    private readonly authService: AuthService,
    private readonly signupFlowService: SignupFlowService,
    private readonly forgotPasswordFlowService: ForgotPasswordFlowService,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.signupFlowService.signup(dto);

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

    const result = await this.signupFlowService.verifySignupOtp(dto, sessionId);

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
    @Body() dto: AuthFlowDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const cookieKey =
      dto.flowName === AuthFlowName.FORGOT_PASSWORD
        ? 'forgot_password_session'
        : 'signup_session';
    const sessionId = getCookieValue(req, cookieKey);

    if (!sessionId) {
      clearSessionCookie(res, cookieKey);

      if (dto.flowName === AuthFlowName.FORGOT_PASSWORD) {
        throw new ForgetPasswordSessionNotFoundException();
      }

      throw new SignupSessionNotFoundException();
    }

    try {
      if (dto.flowName === AuthFlowName.FORGOT_PASSWORD) {
        return await this.forgotPasswordFlowService.resendForgotPasswordOtp(
          sessionId,
        );
      }

      return await this.signupFlowService.resendSignupOtp(sessionId);
    } catch (error) {
      if (
        error instanceof ResendAttemptsExceededException ||
        error instanceof SignupSessionNotFoundException ||
        error instanceof ForgetPasswordSessionNotFoundException
      ) {
        clearSessionCookie(res, cookieKey);
      }

      throw error;
    }
  }

  @Public()
  @Post('session')
  async getSessionDetail(
    @Body() dto: AuthFlowDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const cookieKey =
      dto.flowName === AuthFlowName.FORGOT_PASSWORD
        ? 'forgot_password_session'
        : 'signup_session';
    const sessionId = getCookieValue(req, cookieKey);

    if (!sessionId) {
      clearSessionCookie(res, cookieKey);

      if (dto.flowName === AuthFlowName.FORGOT_PASSWORD) {
        throw new ForgetPasswordSessionNotFoundException();
      }

      throw new SignupSessionNotFoundException();
    }

    try {
      if (dto.flowName === AuthFlowName.FORGOT_PASSWORD) {
        return await this.forgotPasswordFlowService.getForgotPasswordSessionDetail(
          sessionId,
        );
      }

      return await this.signupFlowService.getSignupSessionDetail(sessionId);
    } catch (error) {
      if (
        error instanceof SignupSessionNotFoundException ||
        error instanceof ForgetPasswordSessionNotFoundException
      ) {
        clearSessionCookie(res, cookieKey);
      }

      throw error;
    }
  }

  @Post('getUser')
  async getUser(@Req() req: express.Request & { user?: JwtPayload }) {
    if (!req.user) {
      throw new AccessTokenExpired();
    }

    return this.authService.getUser(req.user);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(
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
    res.clearCookie('access_token', buildCookieOptions());
    res.clearCookie('refresh_token', buildCookieOptions());
    res.clearCookie('signup_session', buildCookieOptions());
    res.clearCookie('forgot_password_session', buildCookieOptions());

    return this.authService.logout();
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.forgotPasswordFlowService.forgotPassword(dto);

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
  @Post('forgot-password/verify-otp')
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

    const result = await this.forgotPasswordFlowService.verifyForgotPasswordOtp(
      dto,
      sessionId,
    );

    clearSessionCookie(res, 'forgot_password_session');

    return result;
  }

  @Public()
  @Post('forgot-password/validate-reset-token')
  validateResetPasswordToken(@Body() dto: ResetPasswordTokenDto) {
    return this.forgotPasswordFlowService.validateResetPasswordToken(dto);
  }

  @Public()
  @Post('forgot-password/reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: express.Request,
  ) {
    return this.forgotPasswordFlowService.resetPassword(dto, {
      deviceInfo:
        req.get('x-device-info') || req.get('user-agent') || 'Unknown device',
      locationInfo: req.get('x-location-info') || req.ip || 'Unknown location',
    });
  }
}

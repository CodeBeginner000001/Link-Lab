import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SignupSessionNotFoundException } from 'src/exceptions/auth.exception';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forget-password.dto';
import { SignupDto, VerifyOtpDto } from './dto/signup.dto';

function getCookieValue(req: express.Request, key: string): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[key];

  return typeof value === 'string' ? value : undefined;
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
      throw new SignupSessionNotFoundException();
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
      throw new SignupSessionNotFoundException();
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
      throw new SignupSessionNotFoundException();
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
}

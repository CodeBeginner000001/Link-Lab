import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import express from 'express';
import { Public } from 'src/decorators/public.decorator';
import { SignupSessionNotFoundException } from 'src/exceptions/auth.exception';
import { AuthService } from './auth.service';
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
}

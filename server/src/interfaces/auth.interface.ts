export interface SignupSession {
  sessionId: string;
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpExpiresAt: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  resendCooldownSeconds: number;
  expiresAt: string;
  createdAt: string;
  lastResendAttemptAt?: string | null;
}

export interface ForgotPasswordSession {
  sessionId: string;
  email: string;
  otp: string;
  otpExpiresAt: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  resendCooldownSeconds: number;
  createdAt: string;
  expiresAt: string;
  lastResendAttemptAt?: string | null;
  isVerified?: boolean;
  resetToken?: string | null;
  resetTokenExpiresAt?: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

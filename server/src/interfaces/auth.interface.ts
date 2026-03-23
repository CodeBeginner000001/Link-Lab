export interface SignupSession {
  sessionId: string;
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpExpiresAt: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  expiresAt: string;
  createdAt: string;
  lastResendAttemptAt?: string | null;
}

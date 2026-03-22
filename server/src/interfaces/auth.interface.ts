export interface SignupSession {
  sessionId: string;
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  resendCooldownSeconds: number;
  expiresAt: string;
  createdAt: string;
}

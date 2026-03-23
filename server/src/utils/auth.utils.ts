import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { SignupSession } from 'src/interfaces/auth.interface';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function generateSessionId(): string {
  return randomUUID();
}

export function generateOtp(length: number): string {
  if (!Number.isInteger(length) || length <= 0)
    throw new Error('OTP length must be a positive integer');
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return randomInt(min, max).toString();
}

export function getMinutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function getExpiryIsoFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function hashPassword(password: string, salt: number): Promise<string> {
  return bcrypt.hash(password, salt);
}

export function buildSignupSession(params: {
  sessionId: string;
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  otpExpirationMinutes: number;
  signupSessionTtlMinutes: number;
}): SignupSession {
  return {
    sessionId: params.sessionId,
    name: params.name,
    email: params.email,
    passwordHash: params.passwordHash,
    otp: params.otp,
    otpAttemptsLeft: params.otpAttemptsLeft,
    resendAttemptsLeft: params.resendAttemptsLeft,
    otpExpiresAt: getExpiryIsoFromNow(params.otpExpirationMinutes),
    createdAt: new Date().toISOString(),
    expiresAt: getExpiryIsoFromNow(params.signupSessionTtlMinutes),
  };
}

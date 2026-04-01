import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomInt, randomUUID } from 'crypto';
import {
  ForgotPasswordSession,
  SignupSession,
} from 'src/interfaces/auth.interface';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function generateSessionId(): string {
  return randomUUID();
}

export function generateLlId(): string {
  return `LL${randomUUID().slice(0, 10)}`;
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

export function parseDurationToMilliseconds(duration: string): number | null {
  const value = duration.trim().toLowerCase();
  const match = value.match(/^(\d+)(ms|s|m|h|d|w)$/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitToMilliseconds: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * unitToMilliseconds[unit];
}

export function parseDurationToSeconds(duration: string): number | null {
  const milliseconds = parseDurationToMilliseconds(duration);

  if (milliseconds === null) {
    return null;
  }

  return Math.ceil(milliseconds / 1000);
}

export function hashPassword(password: string, salt: number): Promise<string> {
  return bcrypt.hash(password, salt);
}

export function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

const algorithm = 'aes-256-cbc';

function buildEncryptionKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    buildEncryptionKey(secret),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, payloadHex] = encryptedText.split(':');

  if (!ivHex || !payloadHex) {
    throw new Error('Invalid encrypted payload format');
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    buildEncryptionKey(secret),
    Buffer.from(ivHex, 'hex'),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function buildSignupSession(params: {
  sessionId: string;
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  resendCooldownSeconds: number;
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
    resendCooldownSeconds: params.resendCooldownSeconds,
    otpExpiresAt: getExpiryIsoFromNow(params.otpExpirationMinutes),
    createdAt: new Date().toISOString(),
    expiresAt: getExpiryIsoFromNow(params.signupSessionTtlMinutes),
  };
}
export function buildForgotPasswordSession(params: {
  sessionId: string;
  email: string;
  otp: string;
  otpAttemptsLeft: number;
  resendAttemptsLeft: number;
  resendCooldownSeconds: number;
  otpExpirationMinutes: number;
  forgotPasswordTtlMinutes: number;
}): ForgotPasswordSession {
  return {
    sessionId: params.sessionId,
    email: params.email,
    otp: params.otp,
    otpExpiresAt: getExpiryIsoFromNow(params.otpExpirationMinutes),
    otpAttemptsLeft: params.otpAttemptsLeft,
    resendAttemptsLeft: params.resendAttemptsLeft,
    resendCooldownSeconds: params.resendCooldownSeconds,
    createdAt: new Date().toISOString(),
    expiresAt: getExpiryIsoFromNow(params.forgotPasswordTtlMinutes),
    lastResendAttemptAt: null,
    isVerified: false,
    resetToken: null,
    resetTokenExpiresAt: null,
  };
}

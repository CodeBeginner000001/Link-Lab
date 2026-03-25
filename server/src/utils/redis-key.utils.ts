export function getSignupLockKey(email: string): string {
  return `auth:signup:lock:${email}`;
}

export function getSignupSessionKey(email: string): string {
  return `auth:signup:session:${email}`;
}

export function getForgotPasswordLockKey(email: string): string {
  return `auth:forgot-password:lock:${email}`;
}

export function getForgotPasswordSessionKey(sessionId: string): string {
  return `auth:forgot-password:session:${sessionId}`;
}

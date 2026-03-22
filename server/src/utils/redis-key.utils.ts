export function getSignupLockKey(email: string): string {
  return `auth:signup:lock:${email}`;
}

export function getSignupSessionKey(email: string): string {
  return `auth:signup:session:${email}`;
}

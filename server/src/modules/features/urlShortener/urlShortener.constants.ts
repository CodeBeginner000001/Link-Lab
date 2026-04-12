export const SHORT_URL_ALIAS_REGEX = /^[a-z0-9_-]+$/;
export const AUTO_ALIAS_LENGTH = 8;
export const AUTO_ALIAS_GENERATION_ATTEMPTS = 12;

export const RESERVED_SHORT_URL_ALIASES = new Set<string>([
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'avatar',
  'dashboard',
  'docs',
  'favicon.ico',
  'health',
  'login',
  'logout',
  'redis',
  'robots.txt',
  'short-urls',
  'signup',
  'static',
  'v1',
]);

export function getShortUrlLookupKey(alias: string): string {
  return `short-url:lookup:${alias}`;
}

export function getShortUrlAnalyticsKey(alias: string): string {
  return `short-url:analytics:${alias}`;
}

export const ONE_TIME_LINK_ALIAS_REGEX = /^[a-z0-9_-]+$/;
export const ONE_TIME_LINK_ALIAS_LENGTH = 12;
export const ONE_TIME_LINK_ALIAS_GENERATION_ATTEMPTS = 12;
export const DEFAULT_ONE_TIME_LINK_PAGE_LIMIT = 10;
export const MAX_ONE_TIME_LINK_PAGE_LIMIT = 100;

export const RESERVED_ONE_TIME_LINK_ALIASES = new Set<string>([
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

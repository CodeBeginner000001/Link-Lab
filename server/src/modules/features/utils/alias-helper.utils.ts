import { randomBytes } from 'crypto';
import {
  InvalidShortUrlAliasException,
  ReservedShortUrlAliasException,
} from 'src/exceptions/url-shortener.exception';

type ValidateAliasOptions = {
  alias: string;
  regex: RegExp;
  reservedAliases?: Set<string>;
  minLength?: number;
  maxLength?: number;
  message?: string;
};

export function validateAlias({
  alias,
  regex,
  reservedAliases,
  minLength = 3,
  maxLength = 32,
  message = 'Alias is invalid',
}: ValidateAliasOptions): void {
  if (reservedAliases?.has(alias)) {
    throw new ReservedShortUrlAliasException();
  }

  if (
    alias.length < minLength ||
    alias.length > maxLength ||
    !regex.test(alias)
  ) {
    throw new InvalidShortUrlAliasException(message);
  }
}
export function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase();
}

export function generateRandomAlias(length = 8): string {
  return randomBytes(16).toString('hex').slice(0, length);
}

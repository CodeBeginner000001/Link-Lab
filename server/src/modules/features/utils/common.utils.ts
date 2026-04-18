import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { QR_PUBLIC_ID_LENGTH } from '../qrCode/qrCode.constants';

type NormalizeHttpUrlOptions = {
  value: string;
  fieldName?: string;
  allowedProtocols?: string[];
};

export function normalizeHttpUrl({
  value,
  fieldName = 'URL',
  allowedProtocols = ['http:', 'https:'],
}: NormalizeHttpUrlOptions): string {
  const input = value.trim();

  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new BadRequestException({
      message: `${fieldName} is invalid`,
      error: 'Bad Request',
    });
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new BadRequestException({
      message: `${fieldName} must use ${allowedProtocols
        .map((item) => item.replace(':', ''))
        .join(' or ')}`,
      error: 'Bad Request',
    });
  }

  return parsed.toString();
}
export function toObjectId(
  id: string,
  message = 'Invalid ObjectId',
): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException({
      message,
      error: 'Bad Request',
    });
  }

  return new Types.ObjectId(id);
}
export function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === 11000;
}
export function parseNonNegativeInt(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function generatePublicId(): string {
  return randomBytes(16).toString('hex').slice(0, QR_PUBLIC_ID_LENGTH);
}

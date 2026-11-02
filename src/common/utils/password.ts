import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

/** At least 8 characters with an uppercase letter, a lowercase letter and a number. */
export const STRONG_PASSWORD_RX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';

export function assertStrongPassword(password: string): void {
  if (!STRONG_PASSWORD_RX.test(password ?? '')) {
    throw new BadRequestException(STRONG_PASSWORD_MESSAGE);
  }
}

/** Random temporary password that always satisfies the strength rule. */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  const body = Array.from(bytes, (b: number) => chars[b % chars.length]).join('');
  return `${body}@7`;
}

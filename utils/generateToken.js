import { randomBytes } from 'crypto';

export function generateUniqueToken(length = 32) {
  return randomBytes(length).toString('hex');
}

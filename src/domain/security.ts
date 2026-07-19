import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  if (password.length < 8) throw new Error('A senha deve ter ao menos 8 caracteres');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expected] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function validCnpj(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const check = (base: string, weights: number[]) => {
    const remainder = base.split('').reduce((sum, digit, i) => sum + Number(digit) * weights[i], 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return check(digits.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]) === Number(digits[12]) && check(digits.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2]) === Number(digits[13]);
}

import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);

export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordPolicyValid(password?: string | null): password is string {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

export function validatePasswordPolicy(password?: string, label = 'senha'): string {
  if (!isPasswordPolicyValid(password)) {
    throw new Error(`A ${label} deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  return password!;
}

export async function hashPassword(password: string) {
  validatePasswordPolicy(password, 'senha');
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

export type UserRole = 'admin' | 'operator' | 'doctor';

export type UserSubject = {
  id: string;
  role: UserRole;
};

export type PatientTarget = {
  id: string;
  responsible_doctor_id?: string | null;
  assigned_user_id?: string | null;
};

export function canReadPatient(user: UserSubject, patient: PatientTarget): boolean {
  if (!user || !patient) return false;
  if (user.role === 'admin' || user.role === 'operator') return true;
  if (user.role === 'doctor') {
    return Boolean(
      (patient.responsible_doctor_id && patient.responsible_doctor_id === user.id) ||
      (patient.assigned_user_id && patient.assigned_user_id === user.id)
    );
  }
  return false;
}

export function canWritePatient(user: UserSubject, patient: PatientTarget): boolean {
  return canReadPatient(user, patient);
}

export function canExportPatientData(user: UserSubject, patient: PatientTarget): boolean {
  if (!user || !patient) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') {
    return Boolean(
      (patient.responsible_doctor_id && patient.responsible_doctor_id === user.id) ||
      (patient.assigned_user_id && patient.assigned_user_id === user.id)
    );
  }
  return false;
}

export function canReadAttachment(user: UserSubject, patient: PatientTarget): boolean {
  return canReadPatient(user, patient);
}

export function canModifyDoctorAssignment(user: UserSubject): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'operator';
}



import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.passwordHashRounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

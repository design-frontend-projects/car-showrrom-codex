import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { authConfig } from './auth.config';

const ENCRYPTION_VERSION = 'v1';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashSecret(value: string, purpose: string): string {
  return createHmac('sha256', `${authConfig.sessionSecret}:${purpose}`).update(value).digest('base64url');
}

export function safeEqual(value: string, expected: string): boolean {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function encryptText(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [ENCRYPTION_VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptText(encryptedValue: string): string {
  const [version, ivText, tagText, encryptedText] = encryptedValue.split('.');

  if (version !== ENCRYPTION_VERSION || !ivText || !tagText || !encryptedText) {
    throw new Error('Unsupported encrypted value format.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function signChallenge(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', authConfig.sessionSecret).update(body).digest('base64url');

  return `${body}.${signature}`;
}

export function verifyChallenge<T extends Record<string, unknown>>(token: string): T {
  const [body, signature] = token.split('.');

  if (!body || !signature) {
    throw new Error('Invalid challenge token.');
  }

  const expected = createHmac('sha256', authConfig.sessionSecret).update(body).digest('base64url');

  if (!safeEqual(signature, expected)) {
    throw new Error('Invalid challenge signature.');
  }

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  const expiresAt = typeof parsed['expiresAt'] === 'string' ? Date.parse(parsed['expiresAt']) : NaN;

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error('Challenge expired.');
  }

  return parsed;
}

function getEncryptionKey(): Buffer {
  return createHash('sha256').update(authConfig.encryptionKey).digest();
}

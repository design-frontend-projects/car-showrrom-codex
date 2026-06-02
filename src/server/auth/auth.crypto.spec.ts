import { decryptText, encryptText, hashSecret, randomToken, signChallenge, verifyChallenge } from './auth.crypto';

describe('auth crypto helpers', () => {
  it('hashes secrets deterministically by purpose', () => {
    expect(hashSecret('token', 'session')).toBe(hashSecret('token', 'session'));
    expect(hashSecret('token', 'session')).not.toBe(hashSecret('token', 'csrf'));
  });

  it('encrypts and decrypts sensitive text', () => {
    const encrypted = encryptText('totp-secret');

    expect(encrypted).not.toContain('totp-secret');
    expect(decryptText(encrypted)).toBe('totp-secret');
  });

  it('signs expiring challenge tokens', () => {
    const token = signChallenge({
      purpose: 'login-2fa',
      userId: '11111111-1111-4111-8111-111111111111',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(verifyChallenge<{ purpose: string }>(token).purpose).toBe('login-2fa');
  });

  it('creates random URL-safe tokens', () => {
    expect(randomToken()).not.toBe(randomToken());
  });
});

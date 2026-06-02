import { parseBody, registerSchema, resetVerifySchema } from './auth.validation';
import { AuthHttpError } from './auth.errors';

describe('auth validation schemas', () => {
  it('normalizes registration email and accepts strong passwords', () => {
    const parsed = parseBody(registerSchema, {
      displayName: 'Ada Lovelace',
      email: 'ADA@EXAMPLE.COM',
      password: 'StrongerPass1!',
    });

    expect(parsed.email).toBe('ada@example.com');
  });

  it('rejects weak registration passwords with field errors', () => {
    expect(() =>
      parseBody(registerSchema, {
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'weak',
      }),
    ).toThrow(AuthHttpError);
  });

  it('rejects malformed reset OTP values', () => {
    expect(() =>
      parseBody(resetVerifySchema, {
        email: 'ada@example.com',
        otp: 'abc123',
      }),
    ).toThrow(AuthHttpError);
  });
});

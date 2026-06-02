import 'dotenv/config';

export interface AuthConfig {
  sessionCookieName: string;
  csrfCookieName: string;
  cookieDomain: string | undefined;
  cookieSecure: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  sessionTtlMinutes: number;
  rememberSessionTtlDays: number;
  sessionRotateAfterMinutes: number;
  sessionSecret: string;
  csrfSecret: string;
  encryptionKey: string;
  passwordHashRounds: number;
  passwordMinLength: number;
  resetOtpDigits: number;
  resetOtpTtlMinutes: number;
  resetOtpMaxAttempts: number;
  resetTransactionTtlMinutes: number;
  rateLimitWindowMinutes: number;
  loginRateLimitMax: number;
  registerRateLimitMax: number;
  resetRateLimitMax: number;
  twoFactorRateLimitMax: number;
  totpIssuer: string;
  totpWindow: number;
  backupCodeCount: number;
  defaultTenantSlug: string;
}

const isProduction = process.env['NODE_ENV'] === 'production';

export const authConfig: AuthConfig = {
  sessionCookieName: readString('AUTH_SESSION_COOKIE_NAME', 'cs_session'),
  csrfCookieName: readString('AUTH_CSRF_COOKIE_NAME', 'cs_csrf'),
  cookieDomain: emptyToUndefined(readString('AUTH_COOKIE_DOMAIN', '')),
  cookieSecure: readBoolean('AUTH_COOKIE_SECURE', isProduction),
  cookieSameSite: readSameSite('AUTH_COOKIE_SAME_SITE', 'lax'),
  sessionTtlMinutes: readInt('AUTH_SESSION_TTL_MINUTES', 60),
  rememberSessionTtlDays: readInt('AUTH_SESSION_REMEMBER_TTL_DAYS', 30),
  sessionRotateAfterMinutes: readInt('AUTH_SESSION_ROTATE_AFTER_MINUTES', 15),
  sessionSecret: readSecret('AUTH_SESSION_SECRET', 'dev-session-secret-change-me-32-bytes'),
  csrfSecret: readSecret('AUTH_CSRF_SECRET', 'dev-csrf-secret-change-me-32-bytes'),
  encryptionKey: readSecret('AUTH_ENCRYPTION_KEY', 'dev-encryption-secret-change-me-32-bytes'),
  passwordHashRounds: readInt('AUTH_PASSWORD_HASH_ROUNDS', 12),
  passwordMinLength: readInt('AUTH_PASSWORD_MIN_LENGTH', 12),
  resetOtpDigits: readInt('AUTH_RESET_OTP_DIGITS', 6),
  resetOtpTtlMinutes: readInt('AUTH_RESET_OTP_TTL_MINUTES', 10),
  resetOtpMaxAttempts: readInt('AUTH_RESET_OTP_MAX_ATTEMPTS', 5),
  resetTransactionTtlMinutes: readInt('AUTH_RESET_TRANSACTION_TTL_MINUTES', 15),
  rateLimitWindowMinutes: readInt('AUTH_RATE_LIMIT_WINDOW_MINUTES', 15),
  loginRateLimitMax: readInt('AUTH_LOGIN_RATE_LIMIT_MAX', 10),
  registerRateLimitMax: readInt('AUTH_REGISTER_RATE_LIMIT_MAX', 10),
  resetRateLimitMax: readInt('AUTH_RESET_RATE_LIMIT_MAX', 5),
  twoFactorRateLimitMax: readInt('AUTH_2FA_RATE_LIMIT_MAX', 10),
  totpIssuer: readString('AUTH_TOTP_ISSUER', 'Car Showroom'),
  totpWindow: readInt('AUTH_TOTP_WINDOW', 1),
  backupCodeCount: readInt('AUTH_BACKUP_CODE_COUNT', 10),
  defaultTenantSlug: readString('AUTH_DEFAULT_TENANT_SLUG', 'public-showroom'),
};

function readString(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  return raw === 'true' || raw === '1';
}

function readSameSite(name: string, fallback: 'lax' | 'strict' | 'none'): 'lax' | 'strict' | 'none' {
  const raw = process.env[name]?.toLowerCase();

  return raw === 'lax' || raw === 'strict' || raw === 'none' ? raw : fallback;
}

function readSecret(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;

  if (isProduction && value === fallback) {
    throw new Error(`${name} must be configured with a production secret.`);
  }

  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters.`);
  }

  return value;
}

function emptyToUndefined(value: string): string | undefined {
  return value.trim().length > 0 ? value.trim() : undefined;
}

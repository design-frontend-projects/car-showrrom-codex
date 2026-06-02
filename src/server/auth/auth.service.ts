import type { Request } from 'express';
import type { Role, User } from '../../generated/prisma/client';
import { ensureDefaultRbacRoles } from '../rbac/default-roles';
import { authConfig } from './auth.config';
import { decryptText, encryptText, hashSecret, randomToken, signChallenge, verifyChallenge } from './auth.crypto';
import { withAuthDatabaseContext, type AuthTransactionClient } from './auth.db';
import { AuthHttpError } from './auth.errors';
import {
  LoginInput,
  RegisterInput,
  ResetCompleteInput,
  ResetRequestInput,
  ResetVerifyInput,
  TwoFactorDisableInput,
  TwoFactorVerifyInput,
} from './auth.validation';
import { hashPassword, verifyPassword } from './password.service';
import { createTotpSetup, verifyTotp } from './totp.service';

type UserWithRoles = User & {
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  roles: {
    role: Role;
  }[];
};

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthUserDto {
  id: string;
  tenantId: string;
  tenantSlug: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
}

export interface AuthSessionDto {
  status: 'authenticated';
  user: AuthUserDto;
  expiresAt: string;
  csrfToken?: string;
}

export interface CurrentProfileDto {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  roles: string[];
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnonymousSessionDto {
  status: 'anonymous';
}

export interface TwoFactorRequiredDto {
  status: 'twoFactorRequired';
  challengeToken: string;
  setupRequired: boolean;
  user: Pick<AuthUserDto, 'email' | 'displayName' | 'twoFactorRequired'>;
}

export interface CreatedSession {
  dto: AuthSessionDto;
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
}

export async function registerUser(input: RegisterInput, metadata: RequestMetadata): Promise<CreatedSession> {
  return withAuthDatabaseContext(async (tx) => {
    const tenant = input.tenantId
      ? await tx.tenant.findUnique({ where: { id: input.tenantId } })
      : await ensureDefaultTenant(tx);

    if (!tenant) {
      throw new AuthHttpError(400, 'auth.error.invalidTenant', { tenantId: 'auth.error.invalidTenant' });
    }

    const existing = await tx.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: input.email,
        },
      },
    });

    if (existing) {
      throw new AuthHttpError(409, 'auth.error.emailTaken', { email: 'auth.error.emailTaken' });
    }

    await ensureDefaultRbacRoles(tx, tenant.id);
    const passwordHash = await hashPassword(input.password);
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        displayName: input.displayName,
        phone: input.phone ?? null,
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });

    const clientRole = await tx.role.findUnique({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'manager',
        },
      },
    });

    if (clientRole) {
      await tx.userRole.upsert({
        where: {
          tenantId_userId_roleId: {
            tenantId: tenant.id,
            userId: user.id,
            roleId: clientRole.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: clientRole.id,
        },
      });
    }

    const createdUser = await loadUserForSession(tx, user.id);

    return createSession(tx, createdUser, metadata, Boolean(input.remember));
  });
}

export async function loginUser(input: LoginInput, metadata: RequestMetadata): Promise<CreatedSession | TwoFactorRequiredDto> {
  return withAuthDatabaseContext(async (tx) => {
    const user = await findLoginUser(tx, input.email, input.tenantId);

    if (!user || !user.isActive || isLocked(user)) {
      throw new AuthHttpError(401, 'auth.error.invalidCredentials');
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      await recordFailedLogin(tx, user);
      throw new AuthHttpError(401, 'auth.error.invalidCredentials');
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    if (user.twoFactorEnabled || user.twoFactorRequired) {
      return createTwoFactorChallenge(user);
    }

    const sessionUser = await loadUserForSession(tx, user.id);
    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return createSession(tx, sessionUser, metadata, Boolean(input.remember));
  });
}

export async function readSession(sessionToken: string | null): Promise<AuthSessionDto | AnonymousSessionDto> {
  if (!sessionToken) {
    return { status: 'anonymous' };
  }

  const resolved = await resolveSession(sessionToken);

  return resolved?.dto ?? { status: 'anonymous' };
}

export async function readCurrentProfile(sessionToken: string | null): Promise<CurrentProfileDto> {
  if (!sessionToken) {
    throw new AuthHttpError(401, 'auth.error.unauthorized');
  }

  return withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken);

    if (!session) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    return mapProfile(session.user);
  });
}

export async function refreshSession(sessionToken: string, metadata: RequestMetadata): Promise<CreatedSession> {
  return withAuthDatabaseContext(async (tx) => {
    const current = await loadSessionRecord(tx, sessionToken);

    if (!current) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    await tx.authSession.update({
      where: { id: current.id },
      data: { revokedAt: new Date() },
    });

    return createSession(tx, current.user, metadata, false);
  });
}

export async function revokeCurrentSession(sessionToken: string | null): Promise<void> {
  if (!sessionToken) {
    return;
  }

  await withAuthDatabaseContext(async (tx) => {
    await tx.authSession.updateMany({
      where: {
        sessionTokenHash: hashSecret(sessionToken, 'session'),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  });
}

export async function revokeAllSessions(sessionToken: string | null): Promise<void> {
  if (!sessionToken) {
    return;
  }

  await withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken);

    if (!session) {
      return;
    }

    await tx.authSession.updateMany({
      where: {
        userId: session.userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  });
}

export async function requestPasswordReset(input: ResetRequestInput): Promise<{ ok: true; demoOtp?: string }> {
  return withAuthDatabaseContext(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        email: input.email,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!user) {
      return { ok: true };
    }

    const otp = createNumericOtp(authConfig.resetOtpDigits);

    await tx.passwordResetOtp.create({
      data: {
        userId: user.id,
        email: input.email,
        otpHash: hashResetOtp(input.email, otp),
        maxAttempts: authConfig.resetOtpMaxAttempts,
        expiresAt: minutesFromNow(authConfig.resetOtpTtlMinutes),
      },
    });

    return process.env['NODE_ENV'] === 'production' ? { ok: true } : { ok: true, demoOtp: otp };
  });
}

export async function verifyPasswordResetOtp(input: ResetVerifyInput): Promise<{ resetToken: string; expiresAt: string }> {
  return withAuthDatabaseContext(async (tx) => {
    const reset = await tx.passwordResetOtp.findFirst({
      where: {
        email: input.email,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reset || reset.expiresAt <= new Date()) {
      throw new AuthHttpError(400, 'auth.error.otpExpired');
    }

    if (reset.attempts >= reset.maxAttempts) {
      throw new AuthHttpError(429, 'auth.error.otpAttemptsExceeded');
    }

    if (reset.otpHash !== hashResetOtp(input.email, input.otp)) {
      await tx.passwordResetOtp.update({
        where: { id: reset.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AuthHttpError(400, 'auth.error.otpMismatch', { otp: 'auth.error.otpMismatch' });
    }

    const resetToken = randomToken();
    const transactionExpiresAt = minutesFromNow(authConfig.resetTransactionTtlMinutes);

    await tx.passwordResetOtp.update({
      where: { id: reset.id },
      data: {
        verifiedAt: new Date(),
        resetTransactionHash: hashSecret(resetToken, 'reset-transaction'),
        transactionExpiresAt,
      },
    });

    return {
      resetToken,
      expiresAt: transactionExpiresAt.toISOString(),
    };
  });
}

export async function completePasswordReset(input: ResetCompleteInput): Promise<{ ok: true }> {
  return withAuthDatabaseContext(async (tx) => {
    const reset = await tx.passwordResetOtp.findUnique({
      where: { resetTransactionHash: hashSecret(input.resetToken, 'reset-transaction') },
    });

    if (
      !reset ||
      reset.consumedAt ||
      !reset.verifiedAt ||
      !reset.transactionExpiresAt ||
      reset.transactionExpiresAt <= new Date()
    ) {
      throw new AuthHttpError(400, 'auth.error.resetTokenInvalid');
    }

    await tx.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash: await hashPassword(input.password),
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await tx.passwordResetOtp.updateMany({
      where: { userId: reset.userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.authSession.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  });
}

export async function startTwoFactorSetup(
  sessionToken: string | null,
  challengeToken?: string,
): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
  return withAuthDatabaseContext(async (tx) => {
    const user = challengeToken
      ? await loadChallengeUser(tx, challengeToken)
      : (await loadSessionRecord(tx, sessionToken ?? ''))?.user;

    if (!user) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    const setup = await createTotpSetup(user.email);

    await tx.user.update({
      where: { id: user.id },
      data: { twoFactorPendingSecretEncrypted: encryptText(setup.secret) },
    });

    return {
      otpauthUrl: setup.otpauthUrl,
      qrCodeDataUrl: setup.qrCodeDataUrl,
    };
  });
}

export async function verifyTwoFactor(
  input: TwoFactorVerifyInput,
  sessionToken: string | null,
  metadata: RequestMetadata,
): Promise<CreatedSession | { ok: true; backupCodes: string[] }> {
  return withAuthDatabaseContext(async (tx) => {
    if (input.challengeToken) {
      const user = await loadChallengeUser(tx, input.challengeToken);
      const enabled = await verifySecondFactor(tx, user, input);

      if (!enabled && user.twoFactorPendingSecretEncrypted && input.code) {
        await enablePendingTwoFactor(tx, user, input.code);
      } else if (!enabled) {
        throw new AuthHttpError(401, 'auth.error.twoFactorMismatch');
      }

      const sessionUser = await loadUserForSession(tx, user.id);
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
      });

      return createSession(tx, sessionUser, metadata, false);
    }

    const session = await loadSessionRecord(tx, sessionToken ?? '');

    if (!session) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    const backupCodes = await enablePendingTwoFactor(tx, session.user, input.code);

    return { ok: true, backupCodes };
  });
}

export async function disableTwoFactor(input: TwoFactorDisableInput, sessionToken: string | null): Promise<{ ok: true }> {
  return withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken ?? '');

    if (!session) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    const passwordMatches = await verifyPassword(input.password, session.user.passwordHash);

    if (!passwordMatches || !(await verifySecondFactor(tx, session.user, input))) {
      throw new AuthHttpError(401, 'auth.error.twoFactorMismatch');
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorRequired: false,
        twoFactorSecretEncrypted: null,
        twoFactorPendingSecretEncrypted: null,
        twoFactorVerifiedAt: null,
      },
    });
    await tx.userBackupCode.deleteMany({ where: { userId: session.user.id } });

    return { ok: true };
  });
}

export async function regenerateBackupCodes(
  input: TwoFactorDisableInput,
  sessionToken: string | null,
): Promise<{ backupCodes: string[] }> {
  return withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken ?? '');

    if (!session) {
      throw new AuthHttpError(401, 'auth.error.unauthorized');
    }

    const passwordMatches = await verifyPassword(input.password, session.user.passwordHash);

    if (!passwordMatches || !(await verifySecondFactor(tx, session.user, input))) {
      throw new AuthHttpError(401, 'auth.error.twoFactorMismatch');
    }

    return { backupCodes: await replaceBackupCodes(tx, session.user.id) };
  });
}

export async function resolveSessionUserId(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookieName = `${authConfig.sessionCookieName}=`;
  const sessionCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName));
  const token = sessionCookie?.slice(cookieName.length);

  if (!token) {
    return null;
  }

  const resolved = await resolveSession(token);

  return resolved?.dto.user.id ?? null;
}

export async function verifySessionCsrf(sessionToken: string | null, csrfToken: string | null): Promise<boolean> {
  if (!sessionToken || !csrfToken) {
    return false;
  }

  return withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken);

    return Boolean(session?.csrfTokenHash && session.csrfTokenHash === hashSecret(csrfToken, 'csrf'));
  });
}

async function resolveSession(sessionToken: string): Promise<{ dto: AuthSessionDto; sessionId: string } | null> {
  return withAuthDatabaseContext(async (tx) => {
    const session = await loadSessionRecord(tx, sessionToken);

    if (!session) {
      return null;
    }

    await tx.authSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      dto: {
        status: 'authenticated',
        user: mapUser(session.user),
        expiresAt: session.expiresAt.toISOString(),
      },
      sessionId: session.id,
    };
  });
}

async function loadSessionRecord(tx: AuthTransactionClient, sessionToken: string) {
  if (!sessionToken) {
    return null;
  }

  const session = await tx.authSession.findUnique({
    where: { sessionTokenHash: hashSecret(sessionToken, 'session') },
    include: {
      user: {
        include: {
          tenant: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }

  return session;
}

async function createSession(
  tx: AuthTransactionClient,
  user: UserWithRoles,
  metadata: RequestMetadata,
  remember: boolean,
): Promise<CreatedSession> {
  const sessionToken = randomToken();
  const csrfToken = randomToken();
  const expiresAt = remember
    ? daysFromNow(authConfig.rememberSessionTtlDays)
    : minutesFromNow(authConfig.sessionTtlMinutes);

  await tx.authSession.create({
    data: {
      userId: user.id,
      sessionTokenHash: hashSecret(sessionToken, 'session'),
      csrfTokenHash: hashSecret(csrfToken, 'csrf'),
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
      rotatedAt: new Date(),
      expiresAt,
    },
  });

  return {
    sessionToken,
    csrfToken,
    expiresAt,
    dto: {
      status: 'authenticated',
      user: mapUser(user),
      expiresAt: expiresAt.toISOString(),
      csrfToken,
    },
  };
}

async function ensureDefaultTenant(tx: AuthTransactionClient) {
  const existing = await tx.tenant.findUnique({
    where: { slug: authConfig.defaultTenantSlug },
  });

  if (existing) {
    return existing;
  }

  return tx.tenant.create({
    data: {
      slug: authConfig.defaultTenantSlug,
      name: 'Public Showroom',
    },
  });
}

async function findLoginUser(tx: AuthTransactionClient, email: string, tenantId?: string): Promise<UserWithRoles | null> {
  return tx.user.findFirst({
    where: {
      email,
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      tenant: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

async function loadUserForSession(tx: AuthTransactionClient, userId: string): Promise<UserWithRoles> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      tenant: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new AuthHttpError(404, 'auth.error.userNotFound');
  }

  return user;
}

async function recordFailedLogin(tx: AuthTransactionClient, user: User): Promise<void> {
  const failedLoginCount = user.failedLoginCount + 1;

  await tx.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount,
      lockedUntil: failedLoginCount >= 5 ? minutesFromNow(15) : null,
    },
  });
}

function isLocked(user: User): boolean {
  return Boolean(user.lockedUntil && user.lockedUntil > new Date());
}

function createTwoFactorChallenge(user: UserWithRoles): TwoFactorRequiredDto {
  return {
    status: 'twoFactorRequired',
    challengeToken: signChallenge({
      purpose: 'login-2fa',
      userId: user.id,
      expiresAt: minutesFromNow(10).toISOString(),
    }),
    setupRequired: user.twoFactorRequired && !user.twoFactorEnabled,
    user: {
      email: user.email,
      displayName: user.displayName,
      twoFactorRequired: user.twoFactorRequired,
    },
  };
}

async function loadChallengeUser(tx: AuthTransactionClient, challengeToken: string): Promise<UserWithRoles> {
  try {
    const payload = verifyChallenge<{ purpose?: unknown; userId?: unknown; expiresAt?: unknown }>(challengeToken);

    if (payload.purpose !== 'login-2fa' || typeof payload.userId !== 'string') {
      throw new Error('Invalid challenge purpose.');
    }

    return loadUserForSession(tx, payload.userId);
  } catch {
    throw new AuthHttpError(401, 'auth.error.twoFactorChallengeInvalid');
  }
}

async function verifySecondFactor(
  tx: AuthTransactionClient,
  user: User,
  input: Pick<TwoFactorVerifyInput, 'code' | 'backupCode'>,
): Promise<boolean> {
  if (input.backupCode) {
    const codeHash = hashSecret(normalizeBackupCode(input.backupCode), 'backup-code');
    const backupCode = await tx.userBackupCode.findUnique({ where: { codeHash } });

    if (!backupCode || backupCode.userId !== user.id || backupCode.usedAt) {
      return false;
    }

    await tx.userBackupCode.update({
      where: { id: backupCode.id },
      data: { usedAt: new Date() },
    });

    return true;
  }

  if (!input.code || !user.twoFactorSecretEncrypted) {
    return false;
  }

  return verifyTotp(input.code, decryptText(user.twoFactorSecretEncrypted));
}

async function enablePendingTwoFactor(
  tx: AuthTransactionClient,
  user: User,
  code: string | undefined,
): Promise<string[]> {
  if (!code || !user.twoFactorPendingSecretEncrypted) {
    throw new AuthHttpError(400, 'auth.error.twoFactorSetupMissing');
  }

  const pendingSecret = decryptText(user.twoFactorPendingSecretEncrypted);

  if (!(await verifyTotp(code, pendingSecret))) {
    throw new AuthHttpError(401, 'auth.error.twoFactorMismatch', { code: 'auth.error.twoFactorMismatch' });
  }

  await tx.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecretEncrypted: user.twoFactorPendingSecretEncrypted,
      twoFactorPendingSecretEncrypted: null,
      twoFactorVerifiedAt: new Date(),
    },
  });

  return replaceBackupCodes(tx, user.id);
}

async function replaceBackupCodes(tx: AuthTransactionClient, userId: string): Promise<string[]> {
  const backupCodes = Array.from({ length: authConfig.backupCodeCount }, () => createBackupCode());

  await tx.userBackupCode.deleteMany({ where: { userId } });
  await tx.userBackupCode.createMany({
    data: backupCodes.map((code) => ({
      userId,
      codeHash: hashSecret(normalizeBackupCode(code), 'backup-code'),
    })),
  });

  return backupCodes;
}

function mapUser(user: UserWithRoles): AuthUserDto {
  return {
    id: user.id,
    tenantId: user.tenantId,
    tenantSlug: user.tenant.slug,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    roles: user.roles.map(({ role }) => role.name),
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorRequired: user.twoFactorRequired,
  };
}

function mapProfile(user: UserWithRoles): CurrentProfileDto {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    tenant: {
      id: user.tenant.id,
      slug: user.tenant.slug,
      name: user.tenant.name,
    },
    roles: user.roles.map(({ role }) => role.name),
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorRequired: user.twoFactorRequired,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function hashResetOtp(email: string, otp: string): string {
  return hashSecret(`${email}:${otp}`, 'reset-otp');
}

function createNumericOtp(digits: number): string {
  const max = 10 ** digits;
  const value = Math.floor(Math.random() * max);

  return value.toString().padStart(digits, '0');
}

function createBackupCode(): string {
  return `${randomToken(5)}-${randomToken(5)}`.replace(/_/g, 'A').toUpperCase();
}

function normalizeBackupCode(code: string): string {
  return code.replace(/\s/g, '').toUpperCase();
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}

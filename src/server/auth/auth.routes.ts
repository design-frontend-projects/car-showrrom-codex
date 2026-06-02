import type { Express, NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authConfig } from './auth.config';
import { randomToken } from './auth.crypto';
import { AuthHttpError, isAuthHttpError } from './auth.errors';
import {
  completePasswordReset,
  disableTwoFactor,
  loginUser,
  readSession,
  refreshSession,
  regenerateBackupCodes,
  registerUser,
  requestPasswordReset,
  revokeAllSessions,
  revokeCurrentSession,
  startTwoFactorSetup,
  verifyPasswordResetOtp,
  verifySessionCsrf,
  verifyTwoFactor,
} from './auth.service';
import {
  loginSchema,
  parseBody,
  regenerateBackupCodesSchema,
  registerSchema,
  resetCompleteSchema,
  resetRequestSchema,
  resetVerifySchema,
  twoFactorDisableSchema,
  twoFactorEnableSchema,
  twoFactorVerifySchema,
} from './auth.validation';
import {
  clearAuthCookies,
  readCsrfCookie,
  readSessionCookie,
  setAuthCookies,
  setCsrfCookie,
} from './cookie.service';

export function registerAuthRoutes(app: Express): void {
  const router = Router();

  router.get('/csrf', (_request, response) => {
    const csrfToken = randomToken();
    setCsrfCookie(response, csrfToken);
    response.status(200).json({ csrfToken });
  });

  router.get('/session', asyncHandler(async (request, response) => {
    const session = await readSession(readSessionCookie(request));

    if (session.status === 'anonymous') {
      clearAuthCookies(response);
    }

    response.status(200).json(session);
  }));
  router.get('/me', asyncHandler(async (request, response) => {
    const session = await readSession(readSessionCookie(request));

    response.status(200).json(session);
  }));

  router.post('/register', registerLimiter, asyncHandler(async (request, response) => {
    const result = await registerUser(parseBody(registerSchema, request.body), getMetadata(request));
    setAuthCookies(response, result.sessionToken, result.csrfToken, result.expiresAt);
    response.status(201).json(result.dto);
  }));

  router.post('/login', loginLimiter, asyncHandler(async (request, response) => {
    const result = await loginUser(parseBody(loginSchema, request.body), getMetadata(request));

    if (!('dto' in result)) {
      response.status(200).json(result);
      return;
    }

    setAuthCookies(response, result.sessionToken, result.csrfToken, result.expiresAt);
    response.status(200).json(result.dto);
  }));

  router.post('/refresh', requireCsrf, asyncHandler(async (request, response) => {
    const result = await refreshSession(requireSessionToken(request), getMetadata(request));
    setAuthCookies(response, result.sessionToken, result.csrfToken, result.expiresAt);
    response.status(200).json(result.dto);
  }));

  router.post('/logout', requireCsrf, asyncHandler(async (request, response) => {
    await revokeCurrentSession(readSessionCookie(request));
    clearAuthCookies(response);
    response.status(200).json({ ok: true });
  }));

  router.post('/logout-all', requireCsrf, asyncHandler(async (request, response) => {
    await revokeAllSessions(readSessionCookie(request));
    clearAuthCookies(response);
    response.status(200).json({ ok: true });
  }));

  router.post('/reset-request', resetLimiter, asyncHandler(async (request, response) => {
    response.status(200).json(await requestPasswordReset(parseBody(resetRequestSchema, request.body)));
  }));

  router.post('/reset-verify', resetLimiter, asyncHandler(async (request, response) => {
    response.status(200).json(await verifyPasswordResetOtp(parseBody(resetVerifySchema, request.body)));
  }));

  router.post('/reset-complete', resetLimiter, asyncHandler(async (request, response) => {
    response.status(200).json(await completePasswordReset(parseBody(resetCompleteSchema, request.body)));
  }));

  router.post('/2fa-enable', twoFactorLimiter, asyncHandler(async (request, response) => {
    const body = parseBody(twoFactorEnableSchema, request.body);
    response.status(200).json(await startTwoFactorSetup(readSessionCookie(request), body.challengeToken));
  }));

  router.post('/2fa-verify', twoFactorLimiter, asyncHandler(async (request, response) => {
    const result = await verifyTwoFactor(
      parseBody(twoFactorVerifySchema, request.body),
      readSessionCookie(request),
      getMetadata(request),
    );

    if ('sessionToken' in result) {
      setAuthCookies(response, result.sessionToken, result.csrfToken, result.expiresAt);
      response.status(200).json(result.dto);
      return;
    }

    response.status(200).json(result);
  }));

  router.post('/2fa-disable', requireCsrf, twoFactorLimiter, asyncHandler(async (request, response) => {
    response.status(200).json(await disableTwoFactor(parseBody(twoFactorDisableSchema, request.body), readSessionCookie(request)));
  }));

  router.post('/2fa-backup-codes/regenerate', requireCsrf, twoFactorLimiter, asyncHandler(async (request, response) => {
    response.status(200).json(await regenerateBackupCodes(parseBody(regenerateBackupCodesSchema, request.body), readSessionCookie(request)));
  }));

  router.use(handleAuthError);
  app.use('/api/auth', router);
}

const loginLimiter = createLimiter(authConfig.loginRateLimitMax);
const registerLimiter = createLimiter(authConfig.registerRateLimitMax);
const resetLimiter = createLimiter(authConfig.resetRateLimitMax);
const twoFactorLimiter = createLimiter(authConfig.twoFactorRateLimitMax);

function createLimiter(max: number) {
  return rateLimit({
    windowMs: authConfig.rateLimitWindowMinutes * 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'auth.error.rateLimited',
    },
  });
}

async function requireCsrf(request: Request, _response: Response, next: NextFunction): Promise<void> {
  const headerToken = request.header('x-csrf-token');
  const cookieToken = readCsrfCookie(request);
  const token = headerToken && cookieToken && headerToken === cookieToken ? headerToken : null;
  const valid = await verifySessionCsrf(readSessionCookie(request), token);

  if (!valid) {
    next(new AuthHttpError(403, 'auth.error.csrf'));
    return;
  }

  next();
}

function requireSessionToken(request: Request): string {
  const token = readSessionCookie(request);

  if (!token) {
    throw new AuthHttpError(401, 'auth.error.unauthorized');
  }

  return token;
}

function asyncHandler(
  handler: (request: Request, response: Response) => Promise<void>,
): (request: Request, response: Response, next: NextFunction) => void {
  return (request, response, next) => {
    handler(request, response).catch(next);
  };
}

function handleAuthError(error: unknown, _request: Request, response: Response, next: NextFunction): void {
  if (!isAuthHttpError(error)) {
    next(error);
    return;
  }

  response.status(error.status).json({
    code: error.code,
    fieldErrors: error.fieldErrors,
  });
}

function getMetadata(request: Request) {
  return {
    userAgent: request.header('user-agent') ?? undefined,
    ipAddress: request.ip,
  };
}

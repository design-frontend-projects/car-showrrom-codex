import type { Request, Response } from 'express';
import { parse, serialize } from 'cookie';
import { authConfig } from './auth.config';

const COOKIE_PATH = '/';

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  return parse(cookieHeader)[name] ?? null;
}

export function readSessionCookie(request: Request): string | null {
  return readCookie(request, authConfig.sessionCookieName);
}

export function readCsrfCookie(request: Request): string | null {
  return readCookie(request, authConfig.csrfCookieName);
}

export function setAuthCookies(response: Response, sessionToken: string, csrfToken: string, expiresAt: Date): void {
  appendCookie(response, authConfig.sessionCookieName, sessionToken, {
    expires: expiresAt,
    httpOnly: true,
  });
  appendCookie(response, authConfig.csrfCookieName, csrfToken, {
    expires: expiresAt,
    httpOnly: false,
  });
}

export function setCsrfCookie(response: Response, csrfToken: string): void {
  appendCookie(response, authConfig.csrfCookieName, csrfToken, {
    httpOnly: false,
  });
}

export function clearAuthCookies(response: Response): void {
  appendCookie(response, authConfig.sessionCookieName, '', {
    expires: new Date(0),
    httpOnly: true,
  });
  appendCookie(response, authConfig.csrfCookieName, '', {
    expires: new Date(0),
    httpOnly: false,
  });
}

function appendCookie(
  response: Response,
  name: string,
  value: string,
  options: { expires?: Date; httpOnly: boolean },
): void {
  const serialized = serialize(name, value, {
    path: COOKIE_PATH,
    domain: authConfig.cookieDomain,
    expires: options.expires,
    httpOnly: options.httpOnly,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
  });
  const existing = response.getHeader('Set-Cookie');

  if (!existing) {
    response.setHeader('Set-Cookie', serialized);
    return;
  }

  response.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, serialized] : [String(existing), serialized]);
}

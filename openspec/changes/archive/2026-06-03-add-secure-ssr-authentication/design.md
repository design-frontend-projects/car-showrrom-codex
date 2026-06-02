## Context

The app is an Angular 22 RC SSR application served by an Express 5 entry point in `src/server.ts`. Prisma 7 and PostgreSQL access already live under `src/server/**`, with RBAC APIs using the server-only database client. The current Angular auth layer is client-oriented and persists access/refresh tokens in browser storage; this change replaces that with server-owned sessions exposed through same-origin API routes and HttpOnly cookies.

Authentication touches the Prisma schema, Express middleware, RBAC request identity, Angular route guards/interceptors, NgRx Signal Store state, topbar UI, signal-form pages, translations, tests, and deployment documentation. Secret handling must stay on the server: password hashes, session tokens, CSRF secrets, reset OTP hashes, TOTP secrets, backup code hashes, and encryption keys must never be imported by browser bundles.

## Goals / Non-Goals

**Goals:**
- Provide registration, login, logout, refresh/session introspection, password reset, TOTP 2FA, backup codes, and local/global signout in SSR mode.
- Use the existing Prisma `User` table as the canonical user model and extend it only where auth lifecycle data requires persistence.
- Prefer server sessions in secure HttpOnly cookies over browser-held JWTs so Angular SSR can resolve the current user without exposing tokens to client JavaScript.
- Keep all secret-bearing auth logic inside `src/server/**`; Angular code only renders forms, performs same-origin API calls, and consumes sanitized auth/session DTOs.
- Use Angular signal forms with schema-based validation and translated validation messages for every auth form.
- Expose persistent auth state through NgRx Signal Store and Angular signals so route guards, API interceptors, RBAC services, and the app shell consume one source of truth.
- Add tests and documentation that cover critical security behaviors, migrations, environment variables, and deployment checks.

**Non-Goals:**
- OAuth/social login, WebAuthn/passkeys, real email/SMS delivery, and production email templates.
- A complete admin user-management surface beyond auth lifecycle endpoints and topbar/session behavior.
- Replacing the existing RBAC model or tenant model.
- Storing plaintext OTPs, passwords, backup codes, TOTP secrets, or session tokens.

## Decisions

1. Use server sessions with HttpOnly cookies as the primary SSR auth strategy.

   The server will create opaque session records and set a signed session cookie with `HttpOnly`, `Secure`, `SameSite=Lax` by default, configurable name/domain/max-age, and production-only HTTPS enforcement. Angular will call `/api/auth/session` during app initialization and after login/logout to hydrate the NgRx Signal Store. SSR route rendering can read cookies through Express without browser storage.

   Alternatives considered:
   - Browser-stored JWTs: rejected because existing localStorage behavior exposes bearer tokens to XSS and is awkward for SSR.
   - JWT in HttpOnly cookies only: acceptable, but opaque sessions allow global signout, rotation, revocation, device metadata, and lower blast radius if the database is authoritative.

2. Add explicit auth persistence models and extend `User`.

   `User` remains canonical and gains fields such as `emailVerifiedAt`, `passwordChangedAt`, `twoFactorEnabled`, `twoFactorRequired`, `twoFactorSecretEncrypted`, `twoFactorVerifiedAt`, `failedLoginCount`, and `lockedUntil`. New models will cover `AuthSession`, `PasswordResetOtp`, and `UserBackupCode`. Session tokens, reset OTPs, and backup codes are stored as hashes. TOTP secrets are encrypted with an environment-provided key before persistence. Tenant-scoped user email uniqueness remains enforced by the existing `@@unique([tenantId, email])`.

   Alternatives considered:
   - Storing auth state in separate user-auth tables only: rejected because the existing RBAC `User` model is already the canonical account identity.
   - Putting reset and session state in memory: rejected because SSR/process restarts and multi-instance deployments require database-backed state.

3. Use Argon2id for password hashing and backup/OTP hashing where appropriate.

   Passwords will be hashed with Argon2id using server-configured memory/time/parallelism settings. Reset OTPs and backup codes will be hashed server-side before storage; because demo OTPs are short numeric values, OTP verification must also enforce expiry, attempts, and rate limits to reduce brute-force risk.

   Alternatives considered:
   - bcrypt: acceptable and widely supported, but Argon2id is preferred for modern password hashing. bcrypt can be used as a fallback if package compatibility blocks Argon2 in the target runtime.

4. Use RFC6238-compatible TOTP with encrypted secrets and hashed backup codes.

   The server will generate a TOTP secret, encrypt it at rest, return only QR setup data/otpauth URI during setup, verify a code before enabling 2FA, and provide one-time backup codes. Disable flow requires password confirmation plus current TOTP or backup code. Required 2FA policy is represented separately from `twoFactorEnabled` so tenant/admin policy can require enrollment later without losing user preference.

   Alternatives considered:
   - SMS/email OTP as 2FA: out of scope and weaker for this app; reset OTP remains demo-only recovery.

5. Share validation intent while keeping enforcement server authoritative.

   Angular forms will use `@angular/forms/signals` schemas for immediate feedback and translated messages. Server routes will validate all payloads again with server-side schemas and normalized error codes. Client validation improves UX; server validation decides security-sensitive outcomes.

   Alternatives considered:
   - Client-only validation: rejected because requests can bypass the browser.
   - Hand-written ad hoc validation per route: rejected because schema-driven validation is easier to test and translate consistently.

6. Protect auth mutation routes with CSRF, rate limiting, sanitization, and consistent errors.

   Cookie-authenticated mutation routes will require a CSRF token/header pair issued by the server, except where a route is deliberately anonymous but still rate limited. Auth routes will normalize identifiers, trim string input, cap payload sizes, avoid account enumeration where appropriate, and return translated error keys rather than raw internals. Rate limits will be route-aware: stricter for login, reset request, reset verify, and 2FA verify.

   Alternatives considered:
   - Relying only on SameSite cookies: rejected because explicit CSRF validation gives stronger defense and clearer tests.

7. Keep Angular auth state as sanitized session state, not secret storage.

   `AuthSignalStore` will remove localStorage token persistence and hold only sanitized user/session state, status, pending 2FA challenge metadata, loading flags, and error keys. It will expose `loadSession`, `register`, `login`, `verifyTwoFactorLogin`, `logoutLocal`, `logoutGlobal`, reset actions, and 2FA management actions. Local signout clears the in-memory store and asks the server to clear only the current session; global signout revokes all sessions for the user.

   Alternatives considered:
   - Reusing the existing token-shaped `AuthSession`: rejected because it implies browser token ownership and conflicts with SSR-safe cookies.

8. Integrate topbar/account UI into the existing shell and design system.

   The app shell will show a PrimeNG avatar/account menu when authenticated and the registration/sign-in entry points when anonymous. Account menu actions include profile/session status, 2FA settings, local signout, and global signout. Mobile drawer presentation will follow existing responsive signals, language, theme, RTL, and accessible focus patterns.

   Alternatives considered:
   - Creating a separate auth shell: rejected because the existing shell already owns navigation, preferences, and account presentation.

## Risks / Trade-offs

- Database migration risk -> Add nullable fields first, create new auth tables with indexes/unique constraints, preserve existing RBAC relations, run `npm run prisma:validate`, `npm run prisma:generate`, migration, and SSR build verification before release.
- Session fixation or token leakage -> Rotate session IDs on login and 2FA completion, store only hashed session tokens, set secure cookie attributes, and revoke sessions on password change/global signout.
- CSRF integration breaks legitimate SSR/API calls -> Provide a `/api/auth/csrf` bootstrap endpoint and an Angular interceptor that attaches the token only for same-origin mutating requests.
- OTP brute force in demo reset flow -> Hash OTPs, expire them quickly, cap attempts, rate-limit request/verify routes, and use generic reset-request responses to avoid email enumeration.
- TOTP secret loss or bad encryption key rotation -> Document `AUTH_ENCRYPTION_KEY`, keep encrypted secret format versioned, and provide a disable/re-enroll path for recovery.
- Native hashing packages can complicate Windows/CI builds -> Prefer maintained packages with Node 24 support and document fallback to bcrypt if Argon2 installation blocks the environment.
- SSR/browser boundary regressions -> Add tests or static checks that browser code does not import Prisma, `pg`, server auth modules, or environment secrets.
- UX complexity for multi-step flows -> Implement small dedicated pages/components for register, login, reset request, reset verify, reset complete, and 2FA setup/verify rather than one large stateful form.

## Migration Plan

1. Add auth dependencies and environment variables in `.env.example`, including session, CSRF, cookie, rate-limit, hashing, OTP, and encryption settings.
2. Extend `prisma/schema.prisma` with auth lifecycle fields and models, then create a Prisma migration for PostgreSQL indexes, constraints, and any auth-related RLS policy changes.
3. Run `npm run prisma:validate`, `npm run prisma:generate`, and `npm run prisma:migrate:dev` locally against the configured `DATABASE_URL`.
4. Implement server auth modules under `src/server/auth/**`, register routes before static/SSR fallback in `src/server.ts`, and connect session identity to RBAC request context.
5. Replace browser token persistence with cookie-backed session APIs, NgRx Signal Store state, SSR-safe initialization, guards, interceptors, and topbar integration.
6. Add auth pages/components/forms, translated validation/error keys, unit tests, server integration tests, README updates, and deployment/security checklist.
7. Verify with `npm test -- --watch=false`, `npm run prisma:validate`, `npm run prisma:generate`, and `npm run build:prod`.

Rollback strategy:
- If migration has been applied but auth is not enabled, keep new nullable fields/tables in place and disable auth routes through deployment config.
- If auth must be rolled back after users exist, revoke sessions, preserve `User.passwordHash`, and avoid dropping auth tables until reset/2FA/session data is no longer needed.

## Open Questions

- Should registration create a new tenant per user for public signup, attach to an existing default tenant, or require an invitation/tenant slug?
- Which Arabic tone should be used for auth translations: formal MSA or a product-localized variant?
- Should 2FA be globally optional at launch, required for admin/system-owner roles only, or tenant-configurable?
- Should integration tests run against a disposable PostgreSQL container in CI or a dedicated test schema on the configured database?

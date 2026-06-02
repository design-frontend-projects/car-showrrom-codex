## 1. Schema, Dependencies, and Configuration

- [x] 1.1 Add auth runtime and test dependencies for Argon2 or bcrypt fallback, cookie/session handling, CSRF, rate limiting, schema validation, TOTP, QR generation, and server integration tests.
- [x] 1.2 Document required auth environment variables in `.env.example`, including session secret, CSRF secret, cookie settings, OTP expiry, rate limits, password hashing settings, and TOTP encryption key.
- [x] 1.3 Update `prisma/schema.prisma` so the canonical `User` model includes auth lifecycle fields and relations for sessions, reset OTPs, and 2FA backup codes.
- [x] 1.4 Add Prisma models, indexes, unique constraints, mapped table names, and cascade behavior for auth sessions, password reset OTPs, and backup codes.
- [x] 1.5 Create the Prisma migration for auth schema changes and any required PostgreSQL indexes or RLS policy adjustments.
- [x] 1.6 Run `npm run prisma:validate` and fix schema issues before generating code.
- [x] 1.7 Run `npm run prisma:generate` and confirm generated client output resolves in server-only TypeScript.

## 2. Server Auth Foundation

- [x] 2.1 Create `src/server/auth/**` module structure for routes, services, repositories, validation schemas, cookies, sessions, CSRF, rate limits, crypto, password hashing, reset OTP, and 2FA helpers.
- [x] 2.2 Implement server-side validation schemas for register, login, reset request, reset verify, reset complete, 2FA setup/verify/disable, backup-code use, and signout requests.
- [x] 2.3 Implement password hashing and verification helpers with configured Argon2id settings or documented bcrypt fallback.
- [x] 2.4 Implement encrypted-at-rest helpers for TOTP secret storage using environment-provided key material.
- [x] 2.5 Implement auth session repository and service with hashed session tokens, rotation, expiry, revocation, local signout, global signout, and sanitized session DTO mapping.
- [x] 2.6 Implement CSRF token issuance/verification and route-aware rate limiting for auth endpoints.
- [x] 2.7 Register auth middleware and routes in `src/server.ts` before static assets and Angular SSR fallback.

## 3. Registration, Login, and Session API

- [x] 3.1 Implement `POST /api/auth/register` with tenant-aware email uniqueness checks, server validation, password hashing, user creation, and secure session creation.
- [x] 3.2 Implement `POST /api/auth/login` with normalized identifiers, password verification, account lock/failure controls, and 2FA challenge branching.
- [x] 3.3 Implement `GET /api/auth/session` or `/api/auth/me` for SSR-safe session introspection without returning token secrets.
- [x] 3.4 Implement `POST /api/auth/refresh` to rotate or extend active sessions according to configuration.
- [x] 3.5 Implement `POST /api/auth/logout` for current-session revocation and cookie clearing.
- [x] 3.6 Implement `POST /api/auth/logout-all` for global signout and all-session revocation.
- [x] 3.7 Connect authenticated session identity to RBAC request context and tenant validation.

## 4. Password Reset OTP Flow

- [x] 4.1 Implement `POST /api/auth/reset-request` with generic responses, demo numeric OTP generation, hashed OTP storage, expiry, attempts, and rate limiting.
- [x] 4.2 Implement `POST /api/auth/reset-verify` with hashed OTP comparison, expiry checks, attempt limits, verified state, and short-lived reset transaction reference.
- [x] 4.3 Implement `POST /api/auth/reset-complete` with verified transaction enforcement, password policy validation, password hash update, reset record consumption, and session revocation.
- [x] 4.4 Add reset-flow audit metadata needed to test expiry, attempts, consumed state, and password-change behavior without exposing plaintext OTPs.

## 5. TOTP 2FA and Backup Codes

- [x] 5.1 Implement `POST /api/auth/2fa-enable` setup start with encrypted pending secret storage and server-generated otpauth URI or QR data.
- [x] 5.2 Implement `POST /api/auth/2fa-verify` for setup verification and login challenge completion using TOTP or backup code.
- [x] 5.3 Generate backup codes after successful setup, store only hashed values, and return plaintext codes only once.
- [x] 5.4 Implement backup-code consumption and regeneration with password plus 2FA confirmation.
- [x] 5.5 Implement `POST /api/auth/2fa-disable` with password confirmation, TOTP or backup-code verification, secret cleanup, and backup-code cleanup.
- [x] 5.6 Represent required 2FA policy separately from user enrollment and enforce pending setup/challenge state during login.

## 6. Angular Auth State and API Client

- [x] 6.1 Replace browser token persistence in `src/app/core/auth/**` with cookie-backed session APIs and sanitized auth/session DTOs.
- [x] 6.2 Expand `AuthSignalStore` with session loading, register, login, 2FA challenge, reset, setup/disable 2FA, local signout, global signout, loading states, and translated error keys.
- [x] 6.3 Add SSR-safe auth initialization so server render and browser hydration can consume current auth state without importing server-only modules.
- [x] 6.4 Add or update auth route guards to handle anonymous, authenticated, and 2FA-required states with safe return URLs.
- [x] 6.5 Add or update Angular HTTP interceptors to attach CSRF tokens for same-origin mutating auth requests and handle unauthorized responses consistently.
- [x] 6.6 Ensure Angular code under `src/app/**` does not import Prisma, `pg`, server auth modules, hashing, TOTP, encryption, or secret-bearing environment values.

## 7. Angular Signal Forms and UI

- [x] 7.1 Implement registration, login, reset request, reset verify, reset complete, 2FA setup, 2FA verify, and 2FA disable forms with Angular signal forms and schema validation.
- [x] 7.2 Add reusable translated validation-message helpers for signal-form field errors and server error keys.
- [x] 7.3 Build accessible responsive auth pages/components using existing PrimeNG, Tailwind, and app design-system patterns.
- [x] 7.4 Integrate topbar authenticated avatar/account menu with profile/session status, 2FA/settings action, local signout, and global signout.
- [x] 7.5 Update mobile drawer account controls so authenticated and anonymous states remain reachable in LTR and RTL layouts.
- [x] 7.6 Verify forms and account controls fit mobile, tablet, and desktop viewports without text overlap or horizontal overflow.

## 8. I18n, Documentation, and Deployment Notes

- [x] 8.1 Add English auth translation keys for form labels, validation, server errors, reset flow, 2FA flow, account menu, and signout actions.
- [x] 8.2 Add matching Arabic auth translation keys and verify parity with existing i18n key tests.
- [x] 8.3 Update `README.md` with architecture diagram, auth API spec, environment variables, migration steps, local setup, verification commands, and deployment/security checklist.
- [x] 8.4 Add CI suggestions for Prisma validate/generate, unit tests, server integration tests, SSR production build, and migration checks.

## 9. Tests and Verification

- [x] 9.1 Add server unit tests for validation schemas, password hashing, session token hashing/rotation, CSRF checks, rate limits, reset OTP expiry/mismatch, and 2FA mismatch/backup-code use.
- [ ] 9.2 Add server integration tests for register, login, logout, refresh/session, reset request/verify/complete, 2FA enable/verify/disable, CSRF rejection, and global signout.
- [x] 9.3 Add Angular unit tests for `AuthSignalStore`, auth API service, guards/interceptors, signal-form validation mapping, and topbar authenticated/anonymous rendering.
- [x] 9.4 Add or update i18n parity tests for auth translation keys.
- [x] 9.5 Run `npm test -- --watch=false` and fix failures.
- [ ] 9.6 Run `npm run prisma:validate`, `npm run prisma:generate`, and the auth migration against the local PostgreSQL database.
- [x] 9.7 Run `npm run build:prod` and confirm Angular SSR build succeeds with auth server routes and generated Prisma client.
- [ ] 9.8 Perform focused manual SSR verification of registration, login, reset OTP, 2FA setup/login, topbar account menu, local signout, and global signout.

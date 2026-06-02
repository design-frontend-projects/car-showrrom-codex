## Why

The app needs a production-shaped authentication foundation before tenant and RBAC workflows can be safely exposed to real users. SSR-friendly sessions, reset recovery, and optional 2FA give users a secure account lifecycle while keeping credentials, tokens, OTPs, encryption keys, and Prisma access on the server.

## What Changes

- Add registration with server-side validation, password hashing, email uniqueness enforcement, and tenant-aware user creation against the canonical Prisma `User` model.
- Add SSR-safe login, logout, refresh/session introspection, and signout flows using secure HttpOnly cookies and server-owned session state.
- Add password reset with a demo numeric OTP that is generated server-side, stored only as a hash with expiry and attempt limits, verified before password change, and cleared after use.
- Add optional/required TOTP 2FA with server-generated setup QR data, encrypted TOTP secrets, verification, disable flow, and hashed backup codes.
- Add Angular 22 signal-form auth screens with schema validation, translated validation and server-error messages, accessible responsive layouts, and SSR-safe API usage.
- Add NgRx Signal Store auth state that exposes the current user, session status, 2FA requirements, loading state, and errors to any component.
- Update the topbar/app shell to show avatar and account menu when logged in, provide local signout and global signout, and preserve existing theme/language controls.
- Add security hardening for auth API routes, including CSRF protection, cookie configuration, rate limiting, request sanitization, password policy, and error shaping.
- Add critical unit and integration tests for registration, login, logout, reset OTP expiry/mismatch, 2FA mismatch/backup-code use, CSRF rejection, signal-store state, and topbar behavior.
- Add README updates with architecture diagram, API spec, environment variables, migration steps, security/deployment checklist, and CI verification suggestions.

## Capabilities

### New Capabilities
- `secure-ssr-authentication`: Covers registration, login, logout, session refresh/introspection, secure cookies, CSRF, rate limits, and server-only authentication boundaries.
- `password-reset-otp`: Covers reset request, demo OTP generation, hashed OTP storage, verification, password update, expiry, attempts, and translated reset errors.
- `totp-two-factor-authentication`: Covers TOTP setup, QR generation, verification, required/optional 2FA policy, disable flow, encrypted secrets, and backup codes.
- `auth-forms-and-state`: Covers Angular signal forms, validation schemas, i18n messages, NgRx Signal Store auth state, route consumption, and topbar account/signout UI.

### Modified Capabilities
- `server-database-access`: Auth routes will extend the server-only Prisma boundary and add migration/generation requirements for auth persistence.
- `multi-tenant-rbac-persistence`: The canonical `User` model will gain auth lifecycle fields and relations while preserving tenant-scoped uniqueness and RBAC integrity.
- `rbac-api-client-state`: Auth state and server session identity will become the trusted source for RBAC API authorization and tenant context propagation.
- `bilingual-rtl-localization`: Auth forms and server validation errors will add English and Arabic translation keys with parity.
- `responsive-layout-signals`: The shell will include authenticated account presentation and compact signout/account controls driven by responsive signals.
- `uber-inspired-ui-system`: Auth screens, account menu, OTP/2FA flows, and validation states will follow the existing visual foundation and accessibility requirements.

## Impact

- Affected database files: `prisma/schema.prisma`, a new Prisma migration under `prisma/migrations/**`, generated Prisma client output through `npm run prisma:generate`, and seed/init code if default auth/RBAC relationships require it.
- Affected server files: `src/server.ts`, new `src/server/auth/**` modules, shared server middleware for cookies, CSRF, rate limits, sessions, validation, encryption, password hashing, and integration with `src/server/db/prisma.ts` and RBAC request context.
- Affected Angular files: `src/app/core/auth/**`, `src/app/state/**` or auth-local signal store files, auth route guards/interceptors, `src/app/features/**` auth pages, `src/app/layout/app-shell/**`, shared form utilities, and route configuration.
- Affected public assets/docs: `public/i18n/en.json`, `public/i18n/ar.json`, `.env.example`, `README.md`, and auth/security checklists.
- New runtime dependencies are expected for password hashing, sessions/cookies, CSRF, rate limiting, schema validation, TOTP, QR generation, and encryption helpers; development dependencies may be added for server integration/e2e tests.
- Build and verification scripts must keep `npm run prisma:validate`, `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run build:prod`, and `npm test -- --watch=false` passing.
- Non-goals: social login/OAuth, real email delivery, WebAuthn/passkeys, full admin user-management UI, payment/KYC identity verification, and production SMS/email OTP delivery.

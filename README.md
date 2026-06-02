# Car Showroom

Angular 22 RC SSR scaffold for a modular car showroom application. The stack uses PrimeNG, PrimeIcons, Tailwind CSS v4, NgRx Signal Store, Angular signal forms, ngx-translate, Driver.js, Google Maps, and Temporal utilities.

## Requirements

- Node `^22.22.3`, `^24.15.0`, or `>=26.0.0`.
- npm `11.x`.
- Angular packages are pinned to `22.0.0-rc.2`.
- `.npmrc` enables `legacy-peer-deps=true` while PrimeNG and NgRx publish Angular 21 peer ranges.

If the machine Node is older than the Angular 22 RC engine range, run commands through:

```bash
npx -p node@24.15.0 -p npm@11.6.2 npm run build
```

## Scripts

- `npm start` runs the dev server.
- `npm run build:dev` builds with dev environment replacements.
- `npm run build:test` builds with test environment replacements.
- `npm run build:prod` builds with prod environment replacements and SSR output.
- `npm test` runs unit tests.
- `npm run serve:ssr:car-showroom` runs the built SSR server.
- `npm run prisma:validate` validates the Prisma schema and config.
- `npm run prisma:generate` generates the Prisma client into `src/generated/prisma`.
- `npm run prisma:migrate:dev` applies local Prisma migrations.
- `npm run prisma:setup` validates the Prisma schema and generates the client.
- `npm run verify:prisma` validates Prisma and runs the production SSR build.

## Database

Prisma 7 is configured for PostgreSQL through `@prisma/adapter-pg`. Local development expects PostgreSQL at `localhost:5432`, database `postgres`, and schema `showroom`.

Create a local `.env` from `.env.example` before running Prisma or SSR commands:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom"
```

Prepare the local database and generated client:

```bash
npm run prisma:migrate:dev
npm run prisma:generate
```

The RBAC schema adds tenant-scoped users, roles, permissions, user-role mappings, and role-permission mappings. After creating a tenant and assigning an initial authorized user, initialize the required tenant roles through the server API:

```bash
curl -X POST http://localhost:4000/api/rbac/roles/defaults \
  -H "Authorization: Bearer <signed-session-token>" \
  -H "X-Tenant-Id: <tenant-uuid>"
```

RBAC API requests must include `X-Tenant-Id`. Angular sends this header from the selected tenant context, and the server validates the authenticated user has access to that tenant before setting PostgreSQL `app.tenant_id` for RLS-scoped Prisma work. The browser must not send or control bypass flags.

PostgreSQL RLS is enabled on tenant-scoped RBAC tables. Normal requests are filtered by `app.tenant_id`; controlled system-owner bypass uses the server-set `app.rbac_bypass` setting after server-side authorization verifies the caller's `system-owner` role. For maintenance SQL, set a valid tenant context or perform controlled migration/repair work as a privileged database role that can intentionally manage RLS policies.

After building and starting the SSR server, check process and database readiness:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/db
```

When running the Docker Compose stack against PostgreSQL on the host machine, `docker-compose.yml` defaults `DATABASE_URL` to `host.docker.internal:5432`. Override `DATABASE_URL` in the shell if your database runs elsewhere.

## Architecture

- `src/app/core` contains singleton services, auth, HTTP, interceptors, logging, and onboarding.
- `src/app/features` contains landing, admin, and client modules.
- `src/app/layout` contains the top nav, auth sidebar, mobile drawer, and route animation shell.
- `src/app/state` contains NgRx Signal Store app/UI state.
- `src/app/utils` contains reusable date, number, text, file, image, and signal-form helpers.
- `src/server/db` contains server-only Prisma database access for the SSR Express server.
- `src/server/auth` contains server-only registration, login, sessions, CSRF, reset OTP, TOTP, backup-code, password hashing, encryption, and validation code.
- `public/i18n` contains ngx-translate JSON files.

```text
Browser/Angular signal forms
  -> same-origin /api/auth requests with cookies + CSRF
  -> Express SSR auth routes in src/server/auth
  -> Prisma server client in src/server/db
  -> PostgreSQL showroom schema
```

Auth state is exposed to Angular through `AuthSignalStore`. The browser stores no access or refresh tokens; session state is read from the server with an HttpOnly session cookie, and user-facing state is a sanitized DTO.

## Authentication

The auth system uses server-owned sessions for SSR. Login and registration set an opaque session cookie (`HttpOnly`, `Secure` in production, configurable `SameSite`) and a readable CSRF cookie used by Angular for mutating same-origin requests. Passwords are hashed with the configured bcrypt fallback, reset OTPs and backup codes are hashed before storage, and TOTP secrets are encrypted at rest.

### API

- `GET /api/auth/csrf` issues a CSRF token cookie for browser mutations.
- `GET /api/auth/session` and `GET /api/auth/me` return `authenticated` or `anonymous` session state.
- `POST /api/auth/register` creates a user in the canonical Prisma `User` model and starts a session.
- `POST /api/auth/login` validates credentials and either starts a session or returns a 2FA challenge.
- `POST /api/auth/refresh` rotates or extends the current session.
- `POST /api/auth/logout` revokes the current session.
- `POST /api/auth/logout-all` revokes all sessions for the user.
- `POST /api/auth/reset-request` generates a demo numeric OTP for an existing account and stores only a hash.
- `POST /api/auth/reset-verify` verifies the OTP and returns a short-lived reset transaction token.
- `POST /api/auth/reset-complete` validates the transaction and stores a newly hashed password.
- `POST /api/auth/2fa-enable` creates encrypted pending TOTP setup data and returns QR setup data.
- `POST /api/auth/2fa-verify` verifies setup or login challenges and issues backup codes or a session.
- `POST /api/auth/2fa-disable` disables 2FA after password plus TOTP/backup-code verification.
- `POST /api/auth/2fa-backup-codes/regenerate` replaces backup codes after password plus 2FA verification.

### Environment

Copy `.env.example` and set production-grade values for:

- `DATABASE_URL`
- `AUTH_SESSION_COOKIE_NAME`, `AUTH_CSRF_COOKIE_NAME`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE`
- `AUTH_SESSION_SECRET`, `AUTH_CSRF_SECRET`, `AUTH_ENCRYPTION_KEY`
- `AUTH_SESSION_TTL_MINUTES`, `AUTH_SESSION_REMEMBER_TTL_DAYS`, `AUTH_SESSION_ROTATE_AFTER_MINUTES`
- `AUTH_PASSWORD_HASH_ROUNDS`, `AUTH_PASSWORD_MIN_LENGTH`
- `AUTH_RESET_OTP_DIGITS`, `AUTH_RESET_OTP_TTL_MINUTES`, `AUTH_RESET_OTP_MAX_ATTEMPTS`, `AUTH_RESET_TRANSACTION_TTL_MINUTES`
- `AUTH_RATE_LIMIT_WINDOW_MINUTES`, `AUTH_LOGIN_RATE_LIMIT_MAX`, `AUTH_REGISTER_RATE_LIMIT_MAX`, `AUTH_RESET_RATE_LIMIT_MAX`, `AUTH_2FA_RATE_LIMIT_MAX`
- `AUTH_TOTP_ISSUER`, `AUTH_TOTP_WINDOW`, `AUTH_BACKUP_CODE_COUNT`, `AUTH_DEFAULT_TENANT_SLUG`

Generate high-entropy secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Migration

Apply auth schema changes locally:

```bash
npm run prisma:validate
npm run prisma:migrate:dev
npm run prisma:generate
```

The auth migration adds nullable user lifecycle fields and creates `auth_sessions`, `password_reset_otps`, and `user_backup_codes`. Existing RBAC tenant uniqueness and cascade behavior are preserved.

### Security Checklist

- Serve production over HTTPS and set `AUTH_COOKIE_SECURE=true`.
- Use long random values for all auth secrets and keep them out of browser bundles.
- Keep `DATABASE_URL` and Prisma imports under `src/server/**`.
- Rotate `AUTH_ENCRYPTION_KEY` only with a planned TOTP re-enrollment or encrypted-secret migration.
- Monitor rate-limit responses on login, reset, and 2FA endpoints.
- Confirm backup codes and reset OTPs are never logged in production.
- Run Prisma migrations before rolling out SSR containers that depend on new auth models.
- Revoke active sessions after password reset or suspected compromise.

### CI Suggestions

- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm test -- --watch=false`
- `npm run build:prod`
- Apply migrations against a disposable PostgreSQL database or isolated test schema.

## Deployment

Build the SSR container and run it behind Nginx:

```bash
docker compose up --build
```

Nginx listens on `http://localhost:8080`, load-balances two Node SSR containers, and applies cache headers to static assets.

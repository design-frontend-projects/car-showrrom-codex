# Car Showroom

Angular 22 RC SSR scaffold for a modular car showroom application. The stack uses PrimeNG, PrimeIcons, Tailwind CSS v4, NgRx Signal Store, Angular signal forms, ngx-translate, Driver.js, Google Maps, and Temporal utilities.

## Requirements

- Node `^22.22.3`, `^24.15.0`, or `>=26.0.0`.
- pnpm `10.x`.
- Angular packages are pinned to `22.0.0-rc.2`.
- `.npmrc` enables `legacy-peer-deps=true` while PrimeNG and NgRx publish Angular 21 peer ranges.

If the machine Node is older than the Angular 22 RC engine range, run commands through:

```bash
corepack pnpm run build
```

## Scripts

- `pnpm start` runs the dev server.
- `pnpm run build:dev` builds with dev environment replacements.
- `pnpm run build:test` builds with test environment replacements.
- `pnpm run build:prod` builds with prod environment replacements and SSR output.
- `pnpm test` runs unit tests.
- `pnpm run serve:ssr:car-showroom` runs the built SSR server.
- `pnpm run prisma:validate` validates the Prisma schema and config.
- `pnpm run prisma:generate` generates the Prisma client into `src/generated/prisma`.
- `pnpm run prisma:migrate:dev` applies local Prisma migrations.
- `pnpm run prisma:setup` validates the Prisma schema and generates the client.
- `pnpm run verify:prisma` validates Prisma and runs the production SSR build.

## Database

Prisma 7 is configured for PostgreSQL through `@prisma/adapter-pg`. Local development expects PostgreSQL at `localhost:5432`, database `postgres`, and schema `showroom`.

Create a local `.env` from `.env.example` before running Prisma or SSR commands:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom"
```

Prepare the local database and generated client:

```bash
pnpm run prisma:migrate:dev
pnpm run prisma:generate
```

The RBAC schema adds tenant-scoped users, roles, permissions, user-role mappings, and role-permission mappings. After creating a tenant and assigning an initial authorized user, initialize the required tenant roles through the server API:

```bash
curl -X POST http://localhost:4000/api/rbac/roles/defaults \
  -H "Authorization: Bearer <signed-session-token>" \
  -H "X-Tenant-Id: <tenant-uuid>"
```

RBAC API requests must include `X-Tenant-Id`. Angular sends this header from the selected tenant context, and the server validates the authenticated user has access to that tenant before setting PostgreSQL `app.tenant_id` for RLS-scoped Prisma work. The browser must not send or control bypass flags.

PostgreSQL RLS is enabled on tenant-scoped RBAC tables. Normal requests are filtered by `app.tenant_id`; controlled system-owner bypass uses the server-set `app.rbac_bypass` setting after server-side authorization verifies the caller's `system-owner` role. For maintenance SQL, set a valid tenant context or perform controlled migration/repair work as a privileged database role that can intentionally manage RLS policies.

The admin RBAC workflow adds the tenant-scoped `UserInvitation` and `RbacAuditEvent` tables through migration `20260603120000_add_rbac_admin_invitation_audit`. These tables store only hashed invitation tokens and sanitized audit metadata. Apply migrations with the normal Prisma workflow before using the admin RBAC screens:

```bash
pnpm run prisma:validate
pnpm run prisma:migrate:dev
pnpm run prisma:generate
```

Admin user, role, permission, invitation, assignment, reset-initiation, and audit endpoints are exposed under `/api/admin/rbac/**`. Mutating requests require the session cookie, matching CSRF header/cookie, `X-Tenant-Id`, and tenant access through the `showroom.admin.manage` permission or the `admin`/`system-owner` roles. Browser-facing DTOs must not include password hashes, invitation tokens, reset OTPs, TOTP secrets, backup codes, or session hashes.

After building and starting the SSR server, check process and database readiness:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/db
```

When running the Docker Compose stack against PostgreSQL on the host machine, `docker-compose.yml` defaults `DATABASE_URL` to `host.docker.internal:5432`. Override `DATABASE_URL` in the shell if your database runs elsewhere.

## Showroom Inventory And Uploads

The showroom domain adds tenant-scoped vehicle taxonomy, listings, ordered listing images, price/model history, and vehicle request review records. Public catalog reads use `/api/showroom/*`; client listing and request mutations require an authenticated session plus the tenant header; admin request review requires the default `showroom.requests.review` permission.

Runtime uploads are stored outside the browser build under `UPLOAD_ROOT`:

```bash
UPLOAD_ROOT=".data/uploads"
SHOWROOM_MAX_IMAGE_BYTES="5242880"
SHOWROOM_MAX_IMAGES_PER_LISTING="12"
SHOWROOM_MEDIA_URL_BASE="/media/listings"
```

The server accepts `jpg`, `jpeg`, `png`, and `webp` files, validates MIME type, extension, size, and file signature, stores a non-guessable storage key, and serves active-listing images through `/media/listings/:storageKey` without exposing filesystem paths. Do not point `UPLOAD_ROOT` at `public/` or any source-controlled build directory.

Each client is currently limited to five active listings per tenant. This is enforced twice: the service pre-check returns the localized `showroom.error.activeListingLimit` error, and the PostgreSQL trigger `showroom.enforce_active_listing_limit` protects against races and future bypasses. When subscription plans are introduced, replace the trigger's hardcoded `5` with a lookup against an entitlement table keyed by tenant and seller user.

## Architecture

- `src/app/core` contains singleton services, auth, HTTP, interceptors, logging, and onboarding.
- `src/app/features` contains landing, admin, and client modules.
- `src/app/layout` contains the top nav, auth sidebar, mobile drawer, and route animation shell.
- `src/app/state` contains NgRx Signal Store app/UI state.
- `src/app/utils` contains reusable date, number, text, file, image, and signal-form helpers.
- `src/server/db` contains server-only Prisma database access for the SSR Express server.
- `src/server/auth` contains server-only registration, login, sessions, CSRF, reset OTP, TOTP, backup-code, password hashing, encryption, and validation code.
- `src/server/showroom` contains server-only catalog, listing, upload, media, and request review logic.
- `src/app/core/showroom` contains Angular-safe showroom DTOs, API services, and signal state.
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
pnpm run prisma:validate
pnpm run prisma:migrate:dev
pnpm run prisma:generate
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

- `pnpm run prisma:validate`
- `pnpm run prisma:generate`
- `pnpm test -- --watch=false`
- `pnpm run build:prod`
- Apply migrations against a disposable PostgreSQL database or isolated test schema.

## Deployment

Build the SSR container and run it behind Nginx:

```bash
docker compose up --build
```

Nginx listens on `http://localhost:8080`, load-balances two Node SSR containers, and applies cache headers to static assets.

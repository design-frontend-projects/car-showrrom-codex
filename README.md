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
- `public/i18n` contains ngx-translate JSON files.

## Deployment

Build the SSR container and run it behind Nginx:

```bash
docker compose up --build
```

Nginx listens on `http://localhost:8080`, load-balances two Node SSR containers, and applies cache headers to static assets.

## Why

The Angular SSR app currently has an Express server but no configured database access layer, so server-side routes and future SSR data workflows cannot persist or query showroom data. This change initializes Prisma 7 with the PostgreSQL driver adapter against the local PostgreSQL instance so server-side code has a typed, ready-to-use database client.

## What Changes

- Add Prisma 7 project setup with a PostgreSQL schema configured for database `postgres` and schema `showroom` on `localhost:5432`.
- Add the PostgreSQL driver adapter wiring for the Angular SSR Express server runtime.
- Add a server-only Prisma client module that can be reused by Express API routes and SSR server code.
- Add environment configuration for the local database connection.
- Add generation, migration, and validation scripts so the project can prepare and verify Prisma during development and builds.

## Capabilities

### New Capabilities
- `server-database-access`: Provides configured, typed Prisma database access from Angular SSR server-side code using PostgreSQL.

### Modified Capabilities

## Impact

- Affects Node SSR server code under `src/server.ts` and new server-only database support files.
- Adds Prisma-related dependencies and scripts to `package.json`.
- Adds Prisma schema and local database environment configuration.
- Requires local PostgreSQL to be reachable at `localhost:5432`, database `postgres`, schema `showroom`.
- Requires build and validation checks to confirm the Angular SSR app compiles with the generated Prisma client.

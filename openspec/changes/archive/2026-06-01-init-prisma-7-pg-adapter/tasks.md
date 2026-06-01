## 1. Prisma Dependencies And Configuration

- [x] 1.1 Install Prisma 7-compatible packages: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, and `@types/pg`.
- [x] 1.2 Add `prisma.config.ts` that loads environment variables and points Prisma CLI datasource access at `DATABASE_URL`.
- [x] 1.3 Add `.env.example` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom` and keep real `.env` values uncommitted.
- [x] 1.4 Add `prisma/schema.prisma` with PostgreSQL datasource metadata and a Prisma 7 client generator using an explicit output path under `src/generated/prisma`.

## 2. Database Schema And Generation

- [x] 2.1 Add the minimal migration/readiness model or SQL needed to ensure PostgreSQL schema `showroom` exists for local development.
- [x] 2.2 Add package scripts for `prisma:generate`, `prisma:validate`, `prisma:migrate:dev`, and a combined Prisma setup or verification flow.
- [x] 2.3 Generate the Prisma client and confirm the generated output is excluded or clearly treated as generated code.
- [x] 2.4 Verify Prisma validation and migration commands target local database `postgres` schema `showroom`.

## 3. SSR Runtime Integration

- [x] 3.1 Create a server-only Prisma module that initializes `PrismaPg` from `@prisma/adapter-pg` and exports a reusable Prisma Client instance.
- [x] 3.2 Ensure the server-only Prisma module reads `DATABASE_URL` at runtime and fails with a clear error when it is missing.
- [x] 3.3 Integrate a database readiness check into the Express SSR server, such as `GET /health/db`, that executes a lightweight Prisma query.
- [x] 3.4 Confirm Prisma, `@prisma/adapter-pg`, and `pg` imports are not used by Angular browser code under `src/app`.

## 4. Build, Docker, And Documentation

- [x] 4.1 Update build or Docker flow so Prisma client generation happens before the Angular SSR production build needs generated imports.
- [x] 4.2 Document local PostgreSQL expectations: host `localhost`, port `5432`, database `postgres`, schema `showroom`, and required `.env` override behavior.
- [x] 4.3 Document the setup and verification commands for installing dependencies, generating the client, applying migrations, building SSR, and checking database readiness.
- [x] 4.4 Run final verification: Prisma validate, Prisma generate, Angular production SSR build, and any existing unit tests that remain relevant.

## Context

The project is an Angular 22 SSR application with an Express entry point in `src/server.ts`. It currently exposes only a `/health` route and delegates the rest of the requests to `AngularNodeAppEngine`; there is no server-side persistence layer yet.

The requested local database target is PostgreSQL on `localhost:5432`, database `postgres`, schema `showroom`. Prisma 7 also changes the client setup shape: generated client output should be explicit, runtime database access should use a driver adapter, and datasource connection details should live in Prisma config/runtime environment rather than being hardcoded into the Prisma schema.

## Goals / Non-Goals

**Goals:**
- Initialize Prisma 7 for the existing Angular SSR app.
- Configure PostgreSQL access through `@prisma/adapter-pg` and the `pg` driver.
- Target the local PostgreSQL database `postgres` and schema `showroom`.
- Provide a reusable server-only Prisma client module for Express handlers and future SSR data access.
- Add project scripts and documentation so developers can generate, migrate, and validate the Prisma setup.
- Keep Angular browser code from importing Prisma, `pg`, or server-only database modules.

**Non-Goals:**
- Build domain models for the full showroom inventory, auth, or admin workflows beyond a minimal readiness model if needed for migration verification.
- Replace the existing Angular client-side API service or auth facade behavior.
- Add production secret management, managed database provisioning, or cloud deployment automation.
- Implement user-facing CRUD screens or API endpoints unrelated to database readiness.

## Decisions

1. Use Prisma 7 packages with the PostgreSQL driver adapter.

   Rationale: Prisma 7 expects driver-adapter based runtime access for database clients. The implementation should install `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, and TypeScript types for `pg`.

   Alternative considered: use a direct `pg` pool without Prisma. That would avoid Prisma generation but would lose the typed data access layer requested by the change.

2. Generate Prisma Client to an explicit source path.

   Rationale: The generated client should have a deterministic import path such as `src/generated/prisma/client`, matching Prisma 7's explicit-output model and keeping the client available to the Angular SSR TypeScript build.

   Alternative considered: rely on `@prisma/client` default imports. That is less aligned with Prisma 7's generated-client output model and makes SSR bundling behavior less explicit.

3. Store database URL in environment configuration and Prisma config.

   Rationale: Use `DATABASE_URL` for both Prisma CLI and runtime connection setup, with local documentation/default examples pointing to `postgresql://postgres:postgres@localhost:5432/postgres?schema=showroom`. This keeps credentials outside committed source while making the expected local database target clear.

   Alternative considered: hardcode the connection string in `schema.prisma`. That would be less flexible and would mix environment-specific details into schema definition.

4. Keep Prisma behind a server-only module.

   Rationale: Add a small module such as `src/server/db/prisma.ts` that creates a `PrismaPg` adapter and `PrismaClient` singleton. Express routes in `src/server.ts` can import this module, but Angular components, services, and shared utilities must not.

   Alternative considered: register Prisma as an Angular provider. That risks accidental browser imports and does not match the current Express-first SSR server architecture.

5. Validate readiness with a database-backed server health route or equivalent server check.

   Rationale: The current `/health` endpoint only confirms the Node process is alive. A dedicated readiness check, for example `/health/db` or an extended internal check, can prove the adapter and local PostgreSQL connection work without adding domain APIs prematurely.

   Alternative considered: rely only on `prisma validate` and `prisma generate`. Those checks do not prove the running SSR server can connect through the configured adapter.

## Risks / Trade-offs

- Local PostgreSQL credentials may differ from the documented default -> Keep `.env.example` explicit and require `.env` overrides for each machine.
- Generated Prisma client under `src/generated` may be accidentally edited -> Add generated output to `.gitignore` or clearly mark it as generated, then rely on `npm run prisma:generate`.
- Prisma or `pg` imports could leak into browser code -> Place database code under a server-only folder and avoid exports from `src/app` or shared browser modules.
- SSR container builds may omit generated Prisma client -> Ensure build scripts run Prisma generation before Angular production build or during the Docker build stage.
- PostgreSQL schema `showroom` may not exist on a fresh database -> Ensure the first migration or setup flow creates/targets the schema before readiness checks are expected to pass.

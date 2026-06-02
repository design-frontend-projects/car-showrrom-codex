## Context

The app currently has Prisma 7 configured for PostgreSQL with generated client output under `src/generated/prisma`, plus a server-only Prisma boundary in `src/server/db/prisma.ts`. Angular browser code already calls backend APIs through `ApiService`, and auth requests flow through `src/app/core/interceptors/auth.interceptor.ts`.

This change adds a multi-tenant RBAC foundation across persistence, server APIs, and Angular state. The database must remain the source of tenant isolation through PostgreSQL row-level security, while Angular must only consume RBAC data through Express routes and typed services.

## Goals / Non-Goals

**Goals:**

- Define Prisma models for `Tenant`, `User`, `Role`, `Permission`, `UserRole`, and `RolePermission` with tenant-scoped relationships.
- Add constraints, composite uniqueness, and indexes that support common authorization lookups.
- Add PostgreSQL RLS policies for tenant-scoped tables and a controlled system-owner bypass.
- Expose RBAC data through server-side API handlers that keep Prisma and `pg` imports out of browser bundles.
- Add Angular RBAC models, services, tenant-context headers, and NgRx Signal Store state for tenant, users, roles, and permissions.
- Preserve the existing `ApiService` URL-only and URL-with-params overload style.

**Non-Goals:**

- Implement a full identity provider, password reset, MFA, or OAuth flow.
- Build complete admin UI screens for managing tenants and roles.
- Replace the existing auth store or guard architecture.
- Introduce a second database access layer outside Prisma and the existing server boundary.

## Decisions

1. Use logical Prisma model names with production-friendly table mappings.

   Prisma will define the requested models as `Tenant`, `User`, `Role`, `Permission`, `UserRole`, and `RolePermission`. Physical tables should use stable snake_case names such as `tenants`, `users`, `roles`, `permissions`, `user_roles`, and `role_permissions` through `@@map`.

   Alternative considered: use quoted PascalCase physical table names. That would mirror the prompt examples, but snake_case mappings avoid quoting friction, reduce conflicts with reserved words like `User`, and fit common PostgreSQL migration style.

2. Scope users, roles, and permissions by tenant, including join tables.

   `User`, `Role`, and `Permission` will each have `tenantId`. `UserRole` and `RolePermission` will also store `tenantId` directly, not only through their related records, so RLS policies can evaluate tenant ownership without relying on joins. Composite relations should ensure assignments cannot cross tenants.

   Alternative considered: omit `tenantId` from join tables and infer tenant through `Role` or `User`. That reduces duplication, but weakens direct RLS enforcement and makes common permission lookups more expensive.

3. Use tenant-scoped uniqueness instead of global names.

   Role names and permission action keys will be unique per tenant. User email should also be unique per tenant unless the eventual login provider requires globally unique emails. This supports tenant isolation and allows the same person or address to exist in more than one organization.

   Alternative considered: make user email globally unique. That simplifies login lookup, but conflicts with the stated tenant-specific user model.

4. Enforce RLS through PostgreSQL settings set by trusted server code.

   Tenant-scoped policies will compare row `tenant_id` values to `current_setting('app.tenant_id', true)`. System-owner bypass will use a separate setting such as `app.rbac_bypass = 'true'`, set only by authenticated server middleware after verifying the caller has the system-owner role or equivalent trusted claim.

   Alternative considered: let clients pass bypass information directly through headers. That is unsafe because a browser could forge the bypass flag. The client may pass tenant context, but the server must validate and translate it into database session settings.

5. Wrap tenant-scoped database work in a reusable server helper.

   Server routes should execute RBAC queries inside a helper that sets `app.tenant_id` and `app.rbac_bypass` for the current transaction or connection scope before calling Prisma. The helper belongs under `src/server/**`; Angular code must not import it.

   Alternative considered: set context ad hoc in each route. That is easy to miss and creates inconsistent RLS behavior.

6. Keep Angular integration in existing core/state patterns.

   Add RBAC models and services under `src/app/core/rbac` or adjacent core folders, reuse `ApiService`, extend the auth interceptor to add `X-Tenant-Id` when available, and add NgRx Signal Store state for tenant, users, roles, and permissions under `src/app/state` or a core RBAC store. Stores should expose loading/error state and CRUD methods that delegate to services.

   Alternative considered: add a separate NgRx classic store package pattern. The repo already uses NgRx Signal Store, so continuing that approach keeps the implementation smaller and more consistent.

## Risks / Trade-offs

- RLS context leakage across pooled connections -> Use transaction-scoped `SET LOCAL` inside a helper and keep tenant-scoped reads/writes within that transaction.
- Prisma migration limitations for RLS -> Put RLS SQL in the generated migration and review it manually because Prisma schema models do not express PostgreSQL policies.
- System-owner bypass overreach -> Server code must derive bypass from trusted auth/session state, never from a raw request header.
- Cross-tenant assignment bugs -> Use composite unique keys and composite foreign-key relations so `UserRole` and `RolePermission` rows cannot link entities from different tenants.
- Email uniqueness ambiguity -> Prefer tenant-scoped email uniqueness now; document that a future global identity provider may add a separate identity table or normalized login identifier.
- Migration rollback risk -> RLS can block repair queries if context is missing; rollback notes must include disabling policies or setting a trusted bypass in controlled maintenance sessions.

## Migration Plan

1. Update `prisma/schema.prisma` with RBAC models, mapped table names, relation fields, composite unique constraints, and indexes.
2. Generate a Prisma migration with the table definitions, then add PostgreSQL SQL for enabling RLS and creating policies.
3. Add required role and permission initialization through a seed or idempotent server-side setup path.
4. Regenerate Prisma client output with `npm run prisma:generate`.
5. Add server RBAC route modules and a tenant-context database helper under `src/server/**`.
6. Add Angular RBAC models, services, interceptor tenant header support, and Signal Store slices.
7. Update README or setup docs if new seed/migration steps are introduced.
8. Verify with Prisma validation, migration, generation, unit tests where applicable, and production SSR build.

Rollback should remove or reverse the RBAC migration in development. For already-applied environments, use a follow-up migration that drops policies first, disables RLS where necessary, drops RBAC foreign keys and tables in dependency order, and regenerates the Prisma client.

## Open Questions

- Should tenant selection during login be explicit, or should authenticated sessions already include a tenant ID?
- Which exact permission action catalog should ship initially beyond examples such as `read_car`, `create_listing`, and `manage_users`?
- Should `system-owner` users belong to a dedicated platform tenant, or can any tenant assign the role while server auth still controls bypass behavior?

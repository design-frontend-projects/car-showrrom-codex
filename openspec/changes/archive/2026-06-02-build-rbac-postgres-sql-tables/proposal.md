## Why

The showroom app needs a production-ready authorization foundation so multiple organizations can share the platform while keeping users, roles, and permissions isolated by tenant. Defining the RBAC schema, tenant isolation rules, and Angular consumption layer now gives future admin and showroom workflows a reliable security contract instead of ad hoc authorization checks.

## What Changes

- Add a multi-tenant RBAC persistence model for tenants, users, roles, permissions, user-role assignments, and role-permission assignments in Prisma.
- Add PostgreSQL row-level security for tenant-scoped RBAC tables using an application tenant context, with a controlled system-owner bypass.
- Add constraints and indexes for tenant-scoped uniqueness, efficient authorization lookups, and cascading cleanup where ownership requires it.
- Add seed or initialization coverage for the required roles: `guest`, `manager`, `admin`, `showroom-manager`, and `system-owner`.
- Add server API contracts that expose RBAC data to Angular without allowing browser code to import Prisma or PostgreSQL packages.
- Add Angular services, an auth interceptor tenant-context header, and NgRx Signal Store state for tenant, users, roles, and permissions.
- Non-goals: this change does not implement a complete login provider, password reset flow, billing tenant lifecycle, or full admin UI screens beyond the service/store integration needed to consume RBAC data.

## Capabilities

### New Capabilities
- `multi-tenant-rbac-persistence`: Covers Prisma RBAC models, tenant-scoped relationships, constraints, indexes, required roles, and PostgreSQL RLS policies.
- `rbac-api-client-state`: Covers server API access boundaries, Angular RBAC services, tenant-context request headers, reusable HTTP methods, and NgRx Signal Store state for RBAC data.

### Modified Capabilities

None.

## Impact

- Affected database artifacts: `schema.prisma`, Prisma migrations, generated Prisma client output, and any RBAC seed or initialization script.
- Affected server areas: `src/server/**` Express routes and database access helpers that must set tenant context before tenant-scoped queries.
- Affected Angular areas: `src/app/core/**` services/interceptors and `src/app/state/**` stores for tenant, user, role, and permission data.
- Affected scripts and verification: `npm run prisma:validate`, `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run build:prod`, and focused tests for RBAC services/state where existing test patterns support them.
- Runtime impact: PostgreSQL must support UUID values, tenant-scoped RLS policies must read application settings such as `app.tenant_id` and a system-owner bypass flag, and requests must carry tenant context through authorized server routes.

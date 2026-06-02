## 1. Prisma Schema and Migration

- [x] 1.1 Add `Tenant`, `User`, `Role`, `Permission`, `UserRole`, and `RolePermission` models to `prisma/schema.prisma` with mapped table names and required tenant relations.
- [x] 1.2 Add tenant-scoped unique constraints for role names, permission action keys, and user email addresses.
- [x] 1.3 Add composite relation constraints that prevent `UserRole` and `RolePermission` rows from linking records across tenants.
- [x] 1.4 Add indexes for tenant, user, role, permission, and common assignment lookup fields.
- [x] 1.5 Generate a Prisma migration for the RBAC tables and review foreign-key cascade behavior.
- [x] 1.6 Add migration SQL that enables RLS on tenant-scoped RBAC tables and creates tenant isolation plus system-owner bypass policies.
- [x] 1.7 Add idempotent RBAC initialization for `guest`, `manager`, `admin`, `showroom-manager`, and `system-owner` roles.

## 2. Server RBAC Boundary

- [x] 2.1 Add server-only RBAC data access helpers under `src/server/**` that use the generated Prisma client.
- [x] 2.2 Add a tenant-context database helper that sets PostgreSQL tenant and bypass settings for scoped Prisma work.
- [x] 2.3 Add Express RBAC API routes for tenant details, tenant users, roles, permissions, user-role assignments, and role-permission assignments.
- [x] 2.4 Validate tenant header access on the server before setting database tenant context.
- [x] 2.5 Ensure system-owner bypass is derived from trusted authenticated server state, not from raw request headers.

## 3. Angular RBAC Integration

- [x] 3.1 Add RBAC TypeScript models for tenants, users, roles, permissions, assignments, request DTOs, and response DTOs.
- [x] 3.2 Add `TenantService`, `UserService`, `RoleService`, and permission access methods using the existing `ApiService`.
- [x] 3.3 Extend the auth interceptor to include a tenant context header when an authenticated session has a selected tenant.
- [x] 3.4 Preserve and use URL-only and URL-with-params HTTP helper overloads for RBAC service methods.
- [x] 3.5 Add NgRx Signal Store state for tenant, users, roles, and permissions with loading and error states.
- [x] 3.6 Ensure forbidden RBAC responses update relevant store error state without clearing unrelated loaded data.

## 4. Documentation and Setup

- [x] 4.1 Update README or setup docs with RBAC migration, generation, and initialization steps.
- [x] 4.2 Document the tenant context header and server-side validation expectation for RBAC API calls.
- [x] 4.3 Document RLS maintenance notes, including how tenant context and controlled bypass are applied.

## 5. Verification

- [x] 5.1 Run `npm run prisma:validate` and fix schema validation issues.
- [x] 5.2 Run `npm run prisma:generate` and confirm RBAC models are generated under `src/generated/prisma`.
- [ ] 5.3 Run `npm run prisma:migrate:dev` against the local PostgreSQL `showroom` schema and verify RLS policies are applied.
- [x] 5.4 Run focused tests for RBAC Angular services, stores, and interceptor tenant-header behavior where existing test patterns support them.
- [x] 5.5 Run `npm test -- --watch=false` if RBAC tests are added or existing tested units are modified.
- [x] 5.6 Run `npm run build:prod` to verify the SSR build keeps Prisma imports server-only.

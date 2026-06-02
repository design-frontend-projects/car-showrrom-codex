## Why

Administrators currently have RBAC persistence, auth session state, and server authorization primitives, but no complete enterprise UI for managing users, roles, permissions, invitations, and admin-only access workflows. This change closes that operational gap so tenant administrators and system owners can manage access from the Angular app without direct database work.

## What Changes

- Add a lazy-loaded RBAC administration area with user, role, permission, assignment, and audit-oriented screens under the existing admin feature.
- Add user management flows for listing active, invited, and disabled users; registering or inviting users; editing profile fields; assigning roles; disabling accounts; and initiating password reset flows.
- Add role management flows for role list/detail, role creation/edit/delete, assigned-user visibility, and permission matrix assignment.
- Add permission management screens that group tenant permission actions by module and expose role assignment through clear toggle or checkbox controls.
- Add route-level and component-level RBAC enforcement for admin screens using role and permission guards.
- Add server-side RBAC admin API routes, request validation, authorization middleware, and sanitized DTOs backed by the existing Prisma RBAC and auth models.
- Add consistent loading, empty, error, toast, confirmation, and responsive states using Angular standalone components, PrimeNG, Tailwind CSS v4, and existing app state patterns.
- Non-goals: real email delivery infrastructure, a new authentication provider, a new database tenancy model, and direct user-permission assignment unless existing models are extended by a later approved change.

## Capabilities

### New Capabilities
- `rbac-admin-screens`: Covers Angular admin screens and user workflows for managing tenant users, invitations, roles, permissions, and assignment UX.
- `rbac-admin-api`: Covers server-side RBAC administration endpoints, DTOs, validation, authorization middleware, and tenant-scoped mutation behavior.
- `rbac-navigation-enforcement`: Covers Angular route guards, navigation visibility, disabled actions, and permission-aware UI behavior for RBAC administration.

### Modified Capabilities
- `multi-tenant-rbac-persistence`: Add tenant-scoped invitation token and admin audit event persistence required for secure invitation and audit-log workflows.
- `rbac-api-client-state`: Extend client services and NgRx Signal Store state to support RBAC administration screen workflows, invitation state, role details, permission grouping, and assignment operations.
- `secure-ssr-authentication`: Extend authenticated admin user flows to support admin-initiated registration, account disablement awareness, and password reset initiation without exposing secret fields.

## Impact

- Affected Angular areas: `src/app/features/admin/**`, admin routes, shared UI components, auth/RBAC guards, RBAC services, RBAC stores, translations, and shell navigation.
- Affected server areas: `src/server/**` RBAC/auth/showroom-adjacent route registration, authorization middleware, Prisma-backed repositories, validation schemas, and route tests.
- Affected database usage: uses existing `Tenant`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `AuthSession`, and `PasswordResetOtp` models, plus tenant-scoped invitation/audit persistence added by this change.
- Affected APIs: new `/api/admin/rbac/**` or equivalent tenant-scoped endpoints for users, invitations, roles, permissions, assignments, audit summaries, and password reset initiation.
- Dependencies: no new UI framework; continue using pnpm, Angular standalone components, PrimeNG for Angular UI primitives, Tailwind CSS v4 for layout/styling, Lucide icons for new RBAC controls, Prisma 7, Express 5, bcryptjs, and existing auth/session tooling. Add `lucide-angular` with pnpm if it is not already available during implementation.
- Verification: Prisma validation/generation where database contracts are touched, focused server route tests, Angular build through pnpm scripts, and browser verification of the admin flows across desktop and mobile layouts.

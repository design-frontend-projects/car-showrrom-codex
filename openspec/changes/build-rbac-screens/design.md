## Context

The application already has Angular standalone routes for admin/client areas, Express server routes, secure cookie auth, Prisma-backed RBAC models, tenant context propagation, and default showroom permissions. The admin feature currently exposes only a lightweight shell and request-review page, while `/api/rbac` exposes basic CRUD with limited authorization semantics and no complete admin-facing UI workflow.

The existing Prisma schema contains `Tenant`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `AuthSession`, and `PasswordResetOtp`, but it does not contain durable invitation-token or audit-event persistence. A complete RBAC admin module needs those support models so invitations can store only hashed tokens and audit screens can show meaningful activity without relying on transient UI state.

Project constraints are Angular SSR, Express 5, Prisma 7, PostgreSQL, Tailwind CSS v4, PrimeNG for Angular UI primitives, Lucide icons for new RBAC controls, ngx-translate, and pnpm scripts. Browser code under `src/app/**` must not import Prisma, PostgreSQL packages, hashing utilities, or server-only auth modules.

## Goals / Non-Goals

**Goals:**
- Provide complete admin RBAC screens for users, pending invitations, disabled users, roles, permissions, assignments, and audit activity.
- Enforce admin access in Angular routes, component actions, and server routes using authenticated session identity plus tenant-scoped RBAC checks.
- Replace unsafe browser-facing user creation contracts with server-owned password hashing, invitation-token hashing, and sanitized DTOs.
- Add minimal tenant-scoped persistence for user invitations and audit events where existing models do not cover the workflow.
- Preserve existing PrimeNG, Tailwind, NgRx Signal Store, Express, and Prisma patterns.

**Non-Goals:**
- Building real email delivery infrastructure; the server can generate invitation/reset handoff payloads and leave provider integration for a later change.
- Adding direct user-permission assignment, because the current RBAC model grants permissions through roles.
- Replacing the authentication system, tenancy model, or PostgreSQL RLS approach.
- Creating a separate back-office application outside the existing Angular admin route tree.

## Decisions

1. Build the RBAC UI inside the existing lazy admin feature.
   - The implementation will expand `src/app/features/admin/**` with an admin shell section for users, roles, permissions, and audit activity.
   - Rationale: the app already has a lazy `admin` route and shared shell navigation, so this keeps route ownership predictable.
   - Alternative considered: create a separate `features/rbac-admin` tree. That would reduce folder size but fragment admin navigation and guard logic.

2. Use PrimeNG components with Tailwind layout utilities and Lucide action icons.
   - Tables, dialogs, confirmations, toasts, segmented filters, skeletons, toggles, and form controls should use PrimeNG. Tailwind v4 should handle layout, density, responsive behavior, and spacing.
   - Lucide icons should be installed with `pnpm add lucide-angular` if unavailable and used for new RBAC action buttons and section navigation.
   - Alternative considered: use Angular Material. PrimeNG is already installed and used by the project, so switching UI systems would add churn.

3. Put RBAC admin data access behind Angular services and Signal Stores.
   - Browser code will call HTTP services under `src/app/core/rbac/**` or a focused admin data layer, then expose screen state through NgRx Signal Store.
   - Stores should track users, invitations, roles, permissions, role details, selected filters, loading/error state, and mutation status without storing password hashes, raw tokens, or server secrets.
   - Alternative considered: local component-only state. That works for small screens but becomes fragile for cross-screen assignment refreshes and navigation guards.

4. Harden the server API instead of trusting the current generic RBAC CRUD shape.
   - Admin endpoints must resolve the authenticated user from the secure session cookie, validate the tenant header, verify `showroom.admin.manage` or equivalent admin/system-owner access, apply CSRF protection to mutations, validate payloads with zod, and execute Prisma work through tenant database context.
   - User creation and invitation endpoints must never accept `passwordHash` from browser clients. Passwords and invitation tokens are generated or hashed server-side.
   - Alternative considered: keep `/api/rbac` as-is and rely on UI hiding. That would leave privileged mutations available to any tenant member with API knowledge.

5. Add tenant-scoped `UserInvitation` and `RbacAuditEvent` persistence.
   - `UserInvitation` should store tenant ID, email, display name, role targets, hashed token, expiry, accepted/revoked timestamps, inviter user ID, and optional resulting user ID.
   - `RbacAuditEvent` should store tenant ID, actor user ID, action, target type/id, timestamp, and JSON metadata without secrets.
   - Rationale: secure invite links and audit screens require durable state that current models do not represent.
   - Alternative considered: encode pending invitations as inactive users or overload `PasswordResetOtp`. Both blur domain semantics and make audit behavior hard to reason about.

6. Route guards and server authorization remain separate layers.
   - Angular `RoleGuard` and `PermissionGuard` will prevent accidental navigation and hide unavailable actions, but every privileged server route must perform its own authorization.
   - Alternative considered: server-only enforcement. That is secure but produces a poor UI because users can navigate into screens only to hit forbidden states.

## Risks / Trade-offs

- Invitation and audit models expand the migration surface -> Keep models small, tenant-scoped, indexed, and covered by Prisma validation/generation plus rollback notes.
- Permission checks can drift between client and server -> Define shared action strings and test route visibility plus server forbidden responses.
- Admin screens can become table-heavy on mobile -> Use responsive PrimeNG layouts, compact filters, drawers/dialogs for edits, and verify mobile screenshots.
- System roles can be damaged by unrestricted edits -> Disable destructive actions for system roles and enforce the same rule on the server.
- Audit metadata may accidentally include sensitive values -> Sanitize audit payloads and explicitly forbid raw tokens, passwords, hashes, TOTP secrets, and reset OTP data.

## Migration Plan

1. Add Prisma models and migration for invitations and audit events, then run `pnpm run prisma:validate` and `pnpm run prisma:generate`.
2. Add server repositories, validation, authorization helpers, API routes, and route tests.
3. Add Angular RBAC services/stores, guards, admin routes, screens, dialogs, and translations.
4. Verify with `pnpm run build:prod`, focused tests, and browser checks of desktop and mobile admin flows.
5. Rollback by reverting the migration and route/UI additions before any production data depends on invitation or audit records.

## Open Questions

- Which email provider should send invitation and reset emails in a later change?
- Should `system-owner` be allowed to administer all tenants through the same UI, or should cross-tenant administration have a separate tenant picker?

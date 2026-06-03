## Context

The RBAC module already has core Prisma models for tenant-scoped users, roles, user-role assignments, invitations, and RBAC audit events. The app also has a partial admin RBAC surface with invitation DTOs/state, an invitations page, and `/api/admin/rbac/invitations` endpoints, including an invitation acceptance repository path.

The remaining gap is the complete product flow: admins need dependable invitation visibility, invited users need a first-time access path that does not require an existing password, and successful acceptance must leave the canonical `users` and `user_roles` tables immediately usable by the existing auth/RBAC guards. Browser code must stay on same-origin API DTOs and must not import Prisma, `pg`, hashing, token, or secret-handling modules.

## Goals / Non-Goals

**Goals:**
- Treat `UserInvitation`, `User`, `UserRole`, `Role`, and `RbacAuditEvent` from `prisma/schema.prisma` as the canonical persistence contract.
- Complete the invited-user lifecycle from pending invitation through password setup, role assignment, invitation acceptance, cleanup, and redirect to login.
- Improve the existing admin invited-users page so admins/system owners can inspect status, timestamps, target roles, inviter/resulting user, and pending actions.
- Integrate invited-user onboarding with existing SSR-safe auth routes, RBAC role normalization, tenant validation, CSRF behavior, rate limits, and sanitized DTO rules.
- Keep Angular state, services, routes, and forms aligned with PrimeNG, Tailwind v4, lucide icons, ngx-translate, and NgRx Signal Store patterns already used in the app.

**Non-Goals:**
- No new off-schema invitation, onboarding-session, user, or role tables.
- No third-party email delivery implementation.
- No replacement of the existing cookie-session login flow.
- No client-side password hashing or browser-visible token/hash fields.
- No broader role editor redesign beyond what is needed to assign invitation target roles.

## Decisions

1. **Use the existing `UserInvitation` record as the source of onboarding truth.**

   The acceptance flow will resolve pending invitations by a server-verified token hash or by a short-lived server-issued onboarding challenge derived from a pending invited email. The invitation remains in `user_invitations` and is marked `accepted` with `acceptedAt` and `resultingUserId` after success.

   Alternative considered: create a separate onboarding-session table. Rejected because the schema already contains invitation lifecycle fields and the request requires exact alignment with `schema.prisma`.

2. **Keep invitation acceptance server-only and transactional.**

   Acceptance must validate the pending invitation, expiration, revocation state, tenant-owned target roles, and tenant email uniqueness before writing. The write sequence should happen in one database transaction: create or update the canonical `User`, upsert `UserRole` rows for invitation roles, update `UserInvitation`, and record `RbacAuditEvent`.

   Alternative considered: create the user first and assign roles in a later client-driven call. Rejected because it can leave onboarded users without effective RBAC roles if a follow-up request fails.

3. **Do not create a full authenticated session during onboarding.**

   Pending invited users can access only the onboarding route and acceptance endpoint. After password setup succeeds, temporary onboarding state is cleared and the user is redirected to login to authenticate through the normal session and 2FA-aware path.

   Alternative considered: automatically sign in the user after acceptance. Rejected because the prompt requires redirecting to login and because using the standard login path keeps session hydration, role normalization, and 2FA behavior consistent.

4. **Expose admin invitation management through sanitized RBAC DTOs.**

   The admin screen should consume DTOs that include safe invitation fields such as `id`, `tenantId`, `email`, `displayName`, `status`, `targetRoles`, `expiresAt`, `acceptedAt`, `revokedAt`, `resentAt`, `createdAt`, `updatedAt`, `inviter`, and `resultingUser`. It must not receive `tokenHash`, raw invitation token values, password hashes, session hashes, OTP data, TOTP secrets, backup codes, or lockout internals.

   Alternative considered: expose Prisma records directly to Angular. Rejected because it violates the server-only database boundary and secret-exclusion requirements.

5. **Extend existing auth and RBAC state instead of adding a parallel client architecture.**

   Admin invitation management stays in the RBAC service/store area. Invited-user password setup belongs in the auth/onboarding route area because it handles unauthenticated first-time access and password policy validation. Shared API helpers, auth error handling, CSRF handling, and translation patterns should be reused.

   Alternative considered: a standalone invitation feature module with its own HTTP/state layer. Rejected because it would duplicate RBAC/auth state concepts already present.

6. **Use target role IDs as the invitation assignment payload, resolved to canonical roles at acceptance.**

   `UserInvitation.targetRoles` is JSON in Prisma, so invitation creation stores a bounded array of tenant-owned role IDs. Acceptance revalidates those role IDs against the invitation tenant before creating `UserRole` records.

   Alternative considered: store role names and resolve them later. Rejected because names can change and `UserRole` requires canonical `roleId` values.

## Risks / Trade-offs

- Pending invitation email lookup can leak account state if handled naively -> keep external login copy generic unless the user has a valid invitation token or server-issued onboarding challenge, and rate-limit recognition attempts.
- Existing partial invitation routes and old `/api/rbac` routes may overlap -> route inventory should identify the canonical admin RBAC surface and avoid wiring new UI to stale endpoints.
- Existing accepted users with the invited email may already exist -> acceptance must define a deterministic behavior: update the existing tenant user safely, activate as needed, and upsert roles, or reject if the state would be unsafe.
- Invitation role IDs can become stale after a role is deleted -> acceptance must revalidate all target roles and fail without partial writes if any role no longer belongs to the tenant.
- System-owner cross-tenant visibility is sensitive -> server context, not browser headers, must decide whether a system owner can list invitations across tenants or only the active tenant.
- Token resend can invalidate old links -> resend behavior must document whether old tokens are replaced and ensure raw tokens are only returned or delivered at creation/resend time through approved channels.

## Migration Plan

1. Inventory existing admin RBAC routes, services, store methods, and invitation page behavior to identify missing contract pieces.
2. Add or adjust server validation and repository paths while preserving the existing Prisma schema unless validation reveals the schema is inconsistent with the required lifecycle.
3. Add Angular auth/onboarding route and form state for invited-user password setup, and enrich the admin invitations screen with statuses, target-role presentation, pending actions, and safe empty/loading/error states.
4. Add or update localized English/Arabic keys and RTL-safe layout behavior for the admin invitation and onboarding screens.
5. Verify with `pnpm run prisma:validate`, `pnpm run prisma:generate`, focused tests, and `pnpm run build:prod`.

Rollback is primarily application-level because no schema change is expected. If code is reverted, pending `UserInvitation` records remain valid data; accepted invitations already linked to `User`/`UserRole` records should be left intact unless an explicit administrative cleanup is required.

## Open Questions

- Should invitation links expose the raw token only in the create/resend API response for local development, or should the implementation require an email-delivery abstraction before exposing resend tokens?
- Should a pending invitation for an email that already has an active user always become a role-assignment onboarding flow, or should admins be required to manage that user directly?
- Should system owners see invitations across all tenants by default, or only within an explicitly selected tenant context?

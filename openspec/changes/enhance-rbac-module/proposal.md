## Why

Invited users currently need a complete, secure path from administrative invitation visibility through first-time password setup and tenant role activation. This change closes the gap between pending `UserInvitation` records and the canonical `User`/`UserRole` RBAC system so admins can manage invitations and invited users can onboard without bypassing existing authentication and authorization controls.

## What Changes

- Complete or expose the admin/system-owner "Invited Users" management screen showing tenant-scoped invitations, status, timestamps, target roles, resulting user linkage, and pending onboarding actions.
- Add invited-user first-time access behavior that recognizes a pending invitation by invited email or invitation token and routes the person into a secure onboarding flow instead of normal login.
- Add password setup for invited users that creates the canonical `User` record from the invitation using only fields defined in `prisma/schema.prisma`.
- Assign invitation-specific roles through canonical `UserRole` records using the existing `Role` records and tenant-aware relationships.
- Mark completed invitations with accepted metadata and resulting user linkage after onboarding succeeds, then clear temporary onboarding state and redirect the invited user to login.
- Preserve existing RBAC guards, role normalization, tenant validation, server-only Prisma access, SSR-safe auth boundaries, and sanitized client DTO rules.
- Non-goals: this change does not introduce third-party email delivery, alter the Prisma schema unless implementation finds a schema mismatch, add self-service role escalation, or replace the existing login/session model.

## Capabilities

### New Capabilities
- `invited-user-onboarding`: End-to-end invitation management, first-time invited-user onboarding, canonical user creation, role assignment, cleanup, and redirection.

### Modified Capabilities
- `multi-tenant-rbac-persistence`: Clarify the persistence contract for `UserInvitation`, `User`, `UserRole`, `Role`, and audit records during invitation acceptance.
- `secure-ssr-authentication`: Extend login/auth behavior to route pending invited identities into secure onboarding without creating a full authenticated session prematurely.
- `rbac-api-client-state`: Add admin APIs, Angular services, and state for invited-user management and invitation onboarding status.
- `auth-forms-and-state`: Add the invited-user password setup screen and route-state behavior to the existing auth form contract.
- `bilingual-rtl-localization`: Require English/Arabic parity and RTL-safe rendering for invited-user management and onboarding screens.

## Impact

- Affected server areas: existing Express auth/admin RBAC routes, server-only Prisma access under `src/server/**`, tenant context validation, password hashing, role assignment, and invitation acceptance transaction handling.
- Affected Angular areas: existing admin RBAC feature screens, auth/onboarding routes, guards, NgRx Signal Store state, API clients, global error handling, and localized UI copy.
- Database impact: the flow must use the existing Prisma models and exact attributes from `prisma/schema.prisma`, especially `UserInvitation`, `User`, `UserRole`, `Role`, and `RbacAuditEvent`; no new off-schema persistence structure is expected.
- Security impact: onboarding endpoints require invitation-token or server-validated pending onboarding context, must rate-limit and CSRF-protect mutations where applicable, and must never expose password hashes, token hashes, TOTP secrets, session tokens, reset OTPs, or lockout internals to Angular.
- Verification impact: focused server/API tests, Angular service/store tests, route/guard tests, translation parity checks, Prisma validation/generation, and production build verification.

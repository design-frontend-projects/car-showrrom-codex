## 1. Schema And Existing Flow Audit

- [x] 1.1 Audit `prisma/schema.prisma` and document the exact `UserInvitation`, `User`, `UserRole`, `Role`, and `RbacAuditEvent` fields used by invitation onboarding.
- [x] 1.2 Inventory existing admin RBAC invitation routes, repositories, services, store methods, admin routes, and invitation pages to identify incomplete or duplicate code paths.
- [x] 1.3 Decide the canonical admin RBAC API surface for invitation management and onboarding acceptance, and remove or leave untouched any stale route only after confirming it is unused.
- [x] 1.4 Run `pnpm run prisma:validate` before code changes that depend on generated Prisma model attributes.

## 2. Server Invitation Lifecycle

- [x] 2.1 Harden invitation creation, listing, resend, and revoke handlers so admin/system-owner authorization, tenant context, target-role validation, CSRF behavior, sanitized DTOs, and audit events match the specs.
- [x] 2.2 Add or refine pending invitation lookup for first-time access so invited identities can receive an onboarding-required response or challenge without creating a full session.
- [x] 2.3 Implement invitation onboarding challenge validation with expiration, tamper protection, rate limiting, and safe error responses.
- [x] 2.4 Ensure invitation acceptance runs in one server-controlled transaction that validates invitation state and role ownership before writing any user, role, invitation, or audit mutation.
- [x] 2.5 Ensure acceptance creates or updates only canonical `User` fields, hashes passwords server-side, sets `passwordChangedAt`, and preserves unrelated auth lifecycle fields.
- [x] 2.6 Ensure acceptance upserts `UserRole` records with `tenantId`, `userId`, and `roleId`, rejects cross-tenant or stale role IDs, and avoids duplicate assignments.
- [x] 2.7 Ensure successful acceptance marks `UserInvitation.status` as `accepted`, sets `acceptedAt`, links `resultingUserId`, records a sanitized `RbacAuditEvent`, and returns no secret fields.
- [x] 2.8 Add focused server tests for valid acceptance, expired/revoked/accepted invitations, stale target roles, existing same-tenant users, non-admin management access, CSRF rejection, and secret exclusion.

## 3. Angular Admin Invitation Management

- [x] 3.1 Align RBAC invitation DTOs and API services with sanitized server responses, including status, timestamps, target roles, inviter, resulting user, and pending action eligibility.
- [x] 3.2 Update NgRx Signal Store invitation state for loading, loaded, failed, mutation, pending counts, create, resend, revoke, acceptance refresh, and non-destructive error handling.
- [x] 3.3 Enhance or expose the invited-users admin screen with role labels, status filters or search where useful, timestamp columns, pending actions, accepted resulting-user details, loading, empty, and error states.
- [x] 3.4 Guard the invited-users route with existing admin/system-owner authorization and ensure direct navigation by non-admin users reaches the localized access-denied behavior.
- [x] 3.5 Add focused Angular service, store, and route/component tests for invitation loading, mutation state updates, forbidden responses, and secret-free DTO assumptions.

## 4. Invited User Onboarding UI

- [x] 4.1 Add the invited-user onboarding route and route-state handling for invitation token or onboarding challenge entry.
- [x] 4.2 Build the password setup screen with Angular signal-form validation for display name, optional phone, password policy, and password confirmation.
- [x] 4.3 Keep the invited email fixed and non-editable throughout onboarding, and submit only the expected token or challenge, display name, optional phone, and password payload.
- [x] 4.4 Update the login UI/store flow so an onboarding-required auth response routes invited first-time users into onboarding while normal login failures remain generic.
- [x] 4.5 Clear temporary onboarding state after success, cancellation, invalid invitation, or route exit, and redirect successful onboarding to the login screen without marking the auth store authenticated.
- [x] 4.6 Add focused Angular tests for valid onboarding route state, invalid/expired invitation recovery, password validation, success redirect, and auth-store separation.

## 5. Localization And UI Quality

- [x] 5.1 Add English and Arabic translation keys for invitation management fields, actions, statuses, validation, dialogs, empty states, loading states, errors, and onboarding success/recovery copy.
- [x] 5.2 Update translation parity tests or add focused checks so invited-user management and onboarding keys match between `public/i18n/en.json` and `public/i18n/ar.json`.
- [x] 5.3 Verify invited-users management and onboarding layouts at narrow and desktop widths in LTR and RTL, including tables or responsive rows, status chips, role labels, forms, and action buttons.
- [x] 5.4 Replace hard-coded confirmation/error strings in the affected invitation UI with localized PrimeNG dialog/toast or existing localized error handling patterns.

## 6. Documentation And Verification

- [x] 6.1 Update README or developer docs only if setup, invitation acceptance, local testing, or environment behavior changes.
- [x] 6.2 Run `pnpm run prisma:validate`.
- [x] 6.3 Run `pnpm run prisma:generate`.
- [x] 6.4 Run focused server and Angular tests for the RBAC invitation and onboarding flow.
- [x] 6.5 Run `pnpm test -- --watch=false` if the project test runner supports the flag in this Angular setup.
- [x] 6.6 Run `pnpm run build:prod`.
- [x] 6.7 Manually verify the end-to-end flow: admin creates invitation, invited identity reaches onboarding, password setup creates or updates the canonical user, roles apply after login, invitation is accepted, and temporary onboarding state is cleared.

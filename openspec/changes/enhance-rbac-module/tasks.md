## 1. Schema And Existing Flow Audit

- [ ] 1.1 Audit `prisma/schema.prisma` and document the exact `UserInvitation`, `User`, `UserRole`, `Role`, and `RbacAuditEvent` fields used by invitation onboarding.
- [ ] 1.2 Inventory existing admin RBAC invitation routes, repositories, services, store methods, admin routes, and invitation pages to identify incomplete or duplicate code paths.
- [ ] 1.3 Decide the canonical admin RBAC API surface for invitation management and onboarding acceptance, and remove or leave untouched any stale route only after confirming it is unused.
- [ ] 1.4 Run `pnpm run prisma:validate` before code changes that depend on generated Prisma model attributes.

## 2. Server Invitation Lifecycle

- [ ] 2.1 Harden invitation creation, listing, resend, and revoke handlers so admin/system-owner authorization, tenant context, target-role validation, CSRF behavior, sanitized DTOs, and audit events match the specs.
- [ ] 2.2 Add or refine pending invitation lookup for first-time access so invited identities can receive an onboarding-required response or challenge without creating a full session.
- [ ] 2.3 Implement invitation onboarding challenge validation with expiration, tamper protection, rate limiting, and safe error responses.
- [ ] 2.4 Ensure invitation acceptance runs in one server-controlled transaction that validates invitation state and role ownership before writing any user, role, invitation, or audit mutation.
- [ ] 2.5 Ensure acceptance creates or updates only canonical `User` fields, hashes passwords server-side, sets `passwordChangedAt`, and preserves unrelated auth lifecycle fields.
- [ ] 2.6 Ensure acceptance upserts `UserRole` records with `tenantId`, `userId`, and `roleId`, rejects cross-tenant or stale role IDs, and avoids duplicate assignments.
- [ ] 2.7 Ensure successful acceptance marks `UserInvitation.status` as `accepted`, sets `acceptedAt`, links `resultingUserId`, records a sanitized `RbacAuditEvent`, and returns no secret fields.
- [ ] 2.8 Add focused server tests for valid acceptance, expired/revoked/accepted invitations, stale target roles, existing same-tenant users, non-admin management access, CSRF rejection, and secret exclusion.

## 3. Angular Admin Invitation Management

- [ ] 3.1 Align RBAC invitation DTOs and API services with sanitized server responses, including status, timestamps, target roles, inviter, resulting user, and pending action eligibility.
- [ ] 3.2 Update NgRx Signal Store invitation state for loading, loaded, failed, mutation, pending counts, create, resend, revoke, acceptance refresh, and non-destructive error handling.
- [ ] 3.3 Enhance or expose the invited-users admin screen with role labels, status filters or search where useful, timestamp columns, pending actions, accepted resulting-user details, loading, empty, and error states.
- [ ] 3.4 Guard the invited-users route with existing admin/system-owner authorization and ensure direct navigation by non-admin users reaches the localized access-denied behavior.
- [ ] 3.5 Add focused Angular service, store, and route/component tests for invitation loading, mutation state updates, forbidden responses, and secret-free DTO assumptions.

## 4. Invited User Onboarding UI

- [ ] 4.1 Add the invited-user onboarding route and route-state handling for invitation token or onboarding challenge entry.
- [ ] 4.2 Build the password setup screen with Angular signal-form validation for display name, optional phone, password policy, and password confirmation.
- [ ] 4.3 Keep the invited email fixed and non-editable throughout onboarding, and submit only the expected token or challenge, display name, optional phone, and password payload.
- [ ] 4.4 Update the login UI/store flow so an onboarding-required auth response routes invited first-time users into onboarding while normal login failures remain generic.
- [ ] 4.5 Clear temporary onboarding state after success, cancellation, invalid invitation, or route exit, and redirect successful onboarding to the login screen without marking the auth store authenticated.
- [ ] 4.6 Add focused Angular tests for valid onboarding route state, invalid/expired invitation recovery, password validation, success redirect, and auth-store separation.

## 5. Localization And UI Quality

- [ ] 5.1 Add English and Arabic translation keys for invitation management fields, actions, statuses, validation, dialogs, empty states, loading states, errors, and onboarding success/recovery copy.
- [ ] 5.2 Update translation parity tests or add focused checks so invited-user management and onboarding keys match between `public/i18n/en.json` and `public/i18n/ar.json`.
- [ ] 5.3 Verify invited-users management and onboarding layouts at narrow and desktop widths in LTR and RTL, including tables or responsive rows, status chips, role labels, forms, and action buttons.
- [ ] 5.4 Replace hard-coded confirmation/error strings in the affected invitation UI with localized PrimeNG dialog/toast or existing localized error handling patterns.

## 6. Documentation And Verification

- [ ] 6.1 Update README or developer docs only if setup, invitation acceptance, local testing, or environment behavior changes.
- [ ] 6.2 Run `pnpm run prisma:validate`.
- [ ] 6.3 Run `pnpm run prisma:generate`.
- [ ] 6.4 Run focused server and Angular tests for the RBAC invitation and onboarding flow.
- [ ] 6.5 Run `pnpm test -- --watch=false` if the project test runner supports the flag in this Angular setup.
- [ ] 6.6 Run `pnpm run build:prod`.
- [ ] 6.7 Manually verify the end-to-end flow: admin creates invitation, invited identity reaches onboarding, password setup creates or updates the canonical user, roles apply after login, invitation is accepted, and temporary onboarding state is cleared.

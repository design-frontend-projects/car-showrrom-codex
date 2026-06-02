## 1. Server Profile Data

- [x] 1.1 Define a sanitized current-profile DTO that includes display name, email, phone, avatar URL, tenant, roles, account status, 2FA state, last login, created date, and updated date.
- [x] 1.2 Add server-side profile data loading that resolves the current user from the authenticated session and reads the corresponding `users` table record with tenant and roles.
- [x] 1.3 Add a protected current-profile endpoint or auth route method that returns the DTO without accepting arbitrary user IDs.
- [x] 1.4 Ensure profile DTO mapping excludes password hashes, session token hashes, CSRF hashes, TOTP secrets, backup codes, reset OTPs, failed login counts, and lockout internals.
- [x] 1.5 Add server tests for authenticated profile loading, anonymous rejection, DTO field inclusion, and sensitive field exclusion.

## 2. Angular Profile Data Layer

- [x] 2.1 Add Angular-safe profile model types under the auth or client profile area.
- [x] 2.2 Add an Angular API service method for loading the current profile through the existing API wrapper.
- [x] 2.3 Add local signal-based loading, error, and retry state for the profile page or a small profile store if reuse becomes necessary.
- [x] 2.4 Ensure Angular profile code does not import Prisma, `@prisma/adapter-pg`, `pg`, or server modules.
- [x] 2.5 Add unit tests for profile service success and authorization/error handling.

## 3. Profile Route And Page

- [x] 3.1 Create a dedicated standalone profile page component under `src/app/features/client/**`.
- [x] 3.2 Update `src/app/features/client/client.routes.ts` so `/client/profile` loads the dedicated profile page and keeps `authGuard`.
- [x] 3.3 Render the profile identity summary with avatar or initials, display name, email, account status, and primary actions.
- [x] 3.4 Render contact, tenant/roles, security, and account timeline sections using real profile DTO fields.
- [x] 3.5 Add localized fallback handling for missing phone, avatar URL, role labels, and last-login values.
- [x] 3.6 Add loading, error, unauthorized, and retry states without showing stale profile data.
- [x] 3.7 Link the profile security section to the existing `/client/security` workflow.

## 4. Design, Responsiveness, And Localization

- [x] 4.1 Add PrimeNG modules and CSS needed for a polished profile page using the existing visual system.
- [x] 4.2 Implement mobile, tablet, and desktop responsive layouts for the identity header, metadata sections, and actions.
- [x] 4.3 Use existing responsive layout signals for profile density decisions where TypeScript state is needed.
- [x] 4.4 Add English translation keys for all profile labels, statuses, actions, loading states, errors, and fallback values.
- [x] 4.5 Add Arabic translation keys with parity for every profile key.
- [x] 4.6 Verify RTL layout for profile summary, metadata rows, status chips, and action controls.
- [x] 4.7 Verify profile text does not clip or overlap at narrow and desktop viewports.

## 5. Verification

- [x] 5.1 Add or update route/component tests for authenticated profile rendering and anonymous guard behavior.
- [x] 5.2 Extend translation parity tests to include profile keys.
- [x] 5.3 Run `npm run prisma:validate` and confirm no schema migration is required.
- [x] 5.4 Run `npm test -- --watch=false` and address failures.
- [x] 5.5 Run `npm run build:prod` and address failures.

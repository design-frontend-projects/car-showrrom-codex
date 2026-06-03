## 1. Persistence and Dependencies

- [x] 1.1 Add `lucide-angular` with pnpm if it is not already installed, and register the specific icons needed by RBAC admin controls.
- [x] 1.2 Add tenant-scoped Prisma persistence for user invitations with hashed token storage, lifecycle timestamps, inviter/resulting-user relations, target role metadata, and tenant indexes.
- [x] 1.3 Add tenant-scoped Prisma persistence for RBAC audit events with actor, action, target, timestamp, sanitized metadata, and tenant/timestamp indexes.
- [x] 1.4 Create and review the Prisma migration for invitation and audit tables, including cascade behavior and rollback notes.
- [x] 1.5 Run `pnpm run prisma:validate` and `pnpm run prisma:generate`, then update generated-type usage in server code as needed.

## 2. Server Authorization and Repositories

- [x] 2.1 Add RBAC admin authorization helpers that resolve the session user, validate tenant access, and require `showroom.admin.manage`, `admin`, or `system-owner` access.
- [x] 2.2 Add zod validation schemas for admin user, invitation, role, permission, assignment, reset, and audit query payloads.
- [x] 2.3 Implement RBAC admin repositories for user listing by state, user create/update/disable, role assignment, role CRUD, permission grouping, role-permission assignment, invitation lifecycle, and audit listing.
- [x] 2.4 Ensure admin user creation and reset initiation hash or generate all secrets server-side and never accept browser-supplied password hashes.
- [x] 2.5 Add audit event recording for user, invitation, role, permission, user-role, role-permission, and reset-initiation mutations with sanitized metadata.

## 3. Server Routes and Tests

- [x] 3.1 Add RBAC admin API routes under a stable prefix such as `/api/admin/rbac` and wire them into the Express server entry point.
- [x] 3.2 Apply CSRF protection, payload limits, validation, tenant context, and authorization middleware to all RBAC admin mutations.
- [x] 3.3 Return sanitized DTOs for users, invitations, roles, permissions, permission groups, and audit events with no password hashes, tokens, OTPs, TOTP secrets, or backup codes.
- [x] 3.4 Add server route tests for unauthorized access, forbidden access, tenant mismatch, invalid payloads, system role protection, invitation acceptance/revocation, assignment mutations, reset initiation, and audit listing.
- [x] 3.5 Add or update tests proving disabled users cannot authenticate or continue using privileged sessions.

## 4. Angular Data Layer and Guards

- [x] 4.1 Add or extend Angular RBAC admin services for users, invitations, roles, permissions, assignments, resets, and audit activity through the shared API wrapper.
- [x] 4.2 Add RBAC admin Signal Store state for active users, disabled users, pending invitations, roles, role details, permission matrix, audit events, loading states, mutation states, filters, and errors.
- [x] 4.3 Ensure RBAC admin client models and stores never contain password hashes, raw passwords, raw invitation tokens, token hashes, reset OTPs, session secrets, TOTP secrets, or backup codes.
- [x] 4.4 Implement reusable `RoleGuard` and `PermissionGuard` behavior for admin routes using current authenticated roles and permissions.
- [x] 4.5 Update navigation visibility and forbidden-state handling so RBAC admin links/actions respond to auth and RBAC state changes.

## 5. Angular Admin Screens

- [x] 5.1 Expand the lazy admin route tree and admin shell to include RBAC users, user details, invitations, roles, role details, permissions, assignments, and audit activity routes.
- [x] 5.2 Build user management screens with active, pending invitation, and disabled sections plus create, invite, edit, disable/enable, reset initiation, and role assignment flows.
- [x] 5.3 Build role management screens with list/detail views, create/edit dialogs, protected system-role behavior, assigned-user visibility, and delete confirmation for eligible roles.
- [x] 5.4 Build permission management and assignment screens with grouped permission presentation and checkbox or toggle-based role-permission matrix controls.
- [x] 5.5 Build the audit activity screen with pagination, actor/action/target/timestamp display, sanitized metadata, loading, empty, and error states.
- [x] 5.6 Add localized copy for RBAC admin navigation, form labels, validation messages, empty states, errors, confirmations, and toasts.

## 6. UI Quality and Accessibility

- [x] 6.1 Use PrimeNG controls and Tailwind CSS v4 utilities for dense enterprise layouts, responsive tables, dialogs, skeletons, toasts, confirmations, and segmented filters.
- [x] 6.2 Use Lucide icons for new RBAC action buttons and navigation where matching icons exist, with accessible labels or tooltips.
- [x] 6.3 Verify desktop and mobile layouts for text overflow, overlapping controls, dialog sizing, keyboard navigation, focus states, and loading/error states.
- [x] 6.4 Ensure destructive actions require confirmation and protected actions communicate disabled state clearly.

## 7. Verification

- [x] 7.1 Run focused server and client tests for RBAC admin services, stores, guards, and routes.
- [x] 7.2 Run `pnpm run build:prod` and fix any Angular SSR, TypeScript, or Prisma generation issues.
- [x] 7.3 Start the local app and verify RBAC admin flows in the browser for authorized admin, non-admin authenticated user, anonymous user, and disabled user cases.
- [x] 7.4 Confirm Angular browser code under `src/app/**` does not import Prisma, `@prisma/adapter-pg`, `pg`, server auth modules, hashing libraries, or secret-bearing environment variables.
- [x] 7.5 Update README or developer notes if setup, migration, environment, or pnpm verification commands change.

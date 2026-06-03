## 1. Schema Contract And Migration

- [x] 1.1 Create the vehicle/RBAC schema mapping document covering Prisma model names, table names, mapped columns, field types, required/optional fields, uniqueness, and relationships.
- [x] 1.2 Add a dev-time schema compatibility script that validates the mapping against `prisma/schema.prisma` and reports missing models, field mismatches, and relationship mismatches.
- [x] 1.3 Add normalized Prisma models for engine, transmission, fuel type, body type, and condition catalogs with tenant scope, active status, normalized names, timestamps, and uniqueness constraints.
- [x] 1.4 Update trim/listing schema relationships or compatibility mappers so define-vehicle dropdowns can use canonical catalog table identifiers.
- [x] 1.5 Add migration and seed logic that creates default catalog rows from existing enum values for each tenant.
- [x] 1.6 Run `pnpm run prisma:validate` and `pnpm run prisma:generate`, then update generated-type imports only in server-safe code paths.

## 2. Server Authorization And APIs

- [x] 2.1 Add or extend server auth helpers to resolve the current session user, active tenant, normalized role names, and admin/system-owner authorization.
- [x] 2.2 Add admin-only read endpoints for sanitized users and role membership with search/filter query support.
- [x] 2.3 Add validation schemas and DTOs for make, model, trim, engine, transmission, fuel type, body type, condition, and users-with-roles responses.
- [x] 2.4 Add tenant-scoped repository/service methods for vehicle definition list, read, create, update, delete/deactivate, and uniqueness checks.
- [x] 2.5 Add dependent catalog endpoints for active models by make and active trims by model.
- [x] 2.6 Add audit events for successful vehicle definition create, update, delete, and deactivate operations.
- [x] 2.7 Add cache helpers with tenant-aware keys, TTLs, and invalidation after catalog mutations.
- [x] 2.8 Register admin vehicle definition and users-with-roles routes under the Express SSR server API boundary.

## 3. Auth Store And Route Enforcement

- [x] 3.1 Define sanitized authenticated user, role, tenant, and persisted-state DTOs for Angular browser code.
- [x] 3.2 Implement a configurable storage adapter that supports `sessionStorage` by default and opt-in `localStorage`.
- [x] 3.3 Extend or create the NgRx Signal Store for current user, normalized roles, derived admin/system-owner flags, loading status, errors, and refresh metadata.
- [x] 3.4 Wire login, current-session restore, session refresh, role refresh, unauthorized responses, and logout to keep browser storage and the store synchronized.
- [x] 3.5 Add route guard logic that blocks admin routes for users without admin/system-owner role state.
- [x] 3.6 Add the accessible Admin module button to the application shell only when the store reports admin/system-owner access.

## 4. Angular Admin Data Layer

- [x] 4.1 Add Angular-safe API services and DTOs for vehicle definition CRUD, dependent dropdowns, users-with-roles, cache refresh, and error states.
- [x] 4.2 Add reusable typed list/form state helpers for admin definition screens using Angular forms, signals, and existing HTTP wrappers.
- [x] 4.3 Add client-side validation helpers for required names, normalized duplicate hints, parent-child relationships, active/deactivated states, and destructive-action blockers.
- [x] 4.4 Ensure Angular browser code does not import Prisma, generated Prisma client code, `pg`, `@prisma/adapter-pg`, or server-only modules.

## 5. Admin Screens And UX

- [x] 5.1 Add the lazy-loaded admin vehicle definitions route area and dashboard links for make, model, trim, transmission, engine, fuel type, body type, condition, and users-with-roles.
- [x] 5.2 Build the reusable PrimeNG/Tailwind v4 entity-management shell with search, table/list, loading, empty, error, create, edit, save, cancel, and delete/deactivate flows.
- [x] 5.3 Configure the car make screen fields, validation, server calls, and delete/deactivate behavior.
- [x] 5.4 Configure the car model screen with make selection, production year metadata, validation, and dependent filtering.
- [x] 5.5 Configure the trim screen with model selection and engine, transmission, fuel type, and body type selections.
- [x] 5.6 Configure the engine, transmission, fuel type, body type, and condition catalog screens.
- [x] 5.7 Build typeahead dropdown behavior with keyboard navigation, metadata display, loading indicators, and missing-data fallbacks.
- [x] 5.8 Build the read-only users-and-roles utility with search, role filters, active status, and no role editing controls.
- [x] 5.9 Add confirmation dialogs, focus restoration, inline validation messages, global error handling, and screen-reader CRUD announcements.
- [x] 5.10 Use Lucide Angular icons for admin command buttons where available and keep PrimeNG components consistent with the existing Angular design system.

## 6. Localization And Documentation

- [x] 6.1 Add English translation keys for admin navigation, definition screens, users-with-roles, validation, dialogs, toasts, access-denied states, and accessibility announcements.
- [x] 6.2 Add matching Arabic translation keys and verify RTL-safe labels for admin screens and dialogs.
- [x] 6.3 Add translation parity coverage for the new admin and schema-validation keys.
- [x] 6.4 Document role detection, sanitized persistence, storage configuration, logout clearing, and token storage guidance.
- [x] 6.5 Document admin vehicle definition API contracts, cache behavior, audit logging, and server authorization requirements.
- [x] 6.6 Document how to add languages and how localized catalog labels fall back when a dynamic label is missing.
- [x] 6.7 Document the schema migration checklist for updating frontend mapping, DTOs, Prisma validation/generation, translations, and tests.

## 7. Tests

- [x] 7.1 Add unit tests for role normalization, derived admin/system-owner flags, and sensitive-field exclusion from persisted auth state.
- [x] 7.2 Add unit tests for storage/store synchronization across login, restore, refresh, role change, unauthorized response, and logout.
- [x] 7.3 Add guard and navigation tests for admin button visibility and unauthorized route blocking.
- [x] 7.4 Add server tests for admin authorization, tenant isolation, users-with-roles sanitization, and forbidden mutation rejection.
- [x] 7.5 Add server tests for vehicle definition CRUD, duplicate handling, parent-child validation, referential integrity, audit logging, and cache invalidation.
- [x] 7.6 Add frontend tests for reusable CRUD screens, inline validation, dialogs, focus management, dropdown loading, typeahead, and dependent make/model/trim behavior.
- [x] 7.7 Add E2E tests for login to role detection, admin button visibility, admin route access, CRUD flows for each vehicle definition entity, users-with-roles display, and dependent dropdown flows.
- [x] 7.8 Add accessibility checks for admin screens covering labels, ARIA attributes, keyboard operation, focus management, announcements, and color contrast.

## 8. Verification

- [x] 8.1 Run the schema compatibility command and confirm incompatible schema states produce clear remediation errors.
- [x] 8.2 Run `pnpm run prisma:validate`.
- [x] 8.3 Run `pnpm run prisma:generate`.
- [x] 8.4 Run targeted unit and server tests for this change.
- [x] 8.5 Run E2E admin access and vehicle definition flows.
- [x] 8.6 Run translation parity and accessibility checks.
- [x] 8.7 Run `pnpm run build:prod`.
- [x] 8.8 Start the local Angular app and verify admin navigation, definition CRUD, users-with-roles display, translations, RTL layout, and dependent dropdowns in the browser.

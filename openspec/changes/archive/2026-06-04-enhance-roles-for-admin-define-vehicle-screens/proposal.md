## Why

The app has RBAC, authenticated state, localization, and admin vehicle listing foundations, but it does not yet define one consistent contract for role-aware user persistence, admin-only navigation enforcement, and CRUD screens for the canonical vehicle definition tables. This change closes that gap so authorized administrators can maintain vehicle taxonomy data safely while non-authorized users see neither the navigation nor the routes.

## What Changes

- Persist the sanitized logged-in user object and role list in configurable browser storage and an NgRx Signal Store, keeping both synchronized across login, refresh, role changes, and logout.
- Centralize role evaluation so `admin` and `system-owner` checks drive admin navigation, route guards, server authorization, and UI states consistently.
- Add an accessible admin entry point that is visible only to users with `admin` or `system-owner` roles and routes to admin screens.
- Add admin-only CRUD screens for car makes, car models, trims/variants, transmissions, engines, fuel types, body types, and listing conditions using consistent PrimeNG/Tailwind v4 form and table patterns.
- Populate define-vehicle dropdowns from canonical persisted data and enum/catalog sources, with dependent loading for make -> model -> trim relationships.
- Add a read-only admin utility that lists users and role membership with search and filtering; role editing is out of scope unless a later change explicitly adds it.
- Add schema mapping documentation for frontend expectations against `prisma/schema.prisma`, including required columns, optional columns, field types, and relationships.
- Add translation keys for all new admin UI, validation, confirmation, error, and screen-reader messages in English and Arabic.
- Add focused unit, integration, and E2E coverage for role hydration, guard behavior, admin visibility, taxonomy CRUD, dependent dropdowns, and translation parity.

Non-goals:

- No token storage migration beyond documenting the recommended session cookie/sessionStorage strategy and avoiding sensitive token persistence in localStorage.
- No bulk import/export, tagging, or advanced role management UI in this change.
- No browser-side Prisma access; all database work remains server-only.

## Capabilities

### New Capabilities
- `vehicle-schema-contract`: Frontend-to-Prisma mapping, compatibility checks, and remediation guidance for vehicle definition, user, and role data.

### Modified Capabilities
- `rbac-api-client-state`: Add sanitized logged-in user and role persistence in browser storage plus NgRx Signal Store, synchronized with auth lifecycle and role refresh.
- `multi-tenant-rbac-persistence`: Clarify role names, user-role lookup, and server-side authorization requirements for admin/system-owner access to admin APIs.
- `admin-vehicle-definition`: Expand admin scope from listing management to vehicle definition CRUD screens for makes, models, trims/variants, transmissions, engines, fuel types, body types, and conditions.
- `vehicle-catalog-inventory`: Require define-vehicle forms and dependent dropdowns to load options from canonical tables/enums rather than hard-coded browser lists.
- `bilingual-rtl-localization`: Add translation parity requirements for the new admin navigation, vehicle definition screens, validation, dialogs, toasts, and accessibility announcements.

## Impact

- Angular app areas: `src/app/core/auth`, `src/app/core/http`, `src/app/core/showroom`, `src/app/features/admin/**`, `src/app/layout/**`, `src/app/state/**`, `src/app/shared/**`, and translation JSON under `public/i18n`.
- Server/API areas: `src/server/**` admin endpoints, RBAC authorization helpers, vehicle catalog repositories, schema validation utilities, audit logging, and error response contracts.
- Database/schema: uses existing `Tenant`, `User`, `Role`, `UserRole`, `CarMake`, `CarModel`, `CarVariant`, and `CarListing` definitions from `prisma/schema.prisma`; adds or verifies normalized canonical catalog tables for engines, transmissions, fuel types, body types, and conditions because enum-only fields cannot satisfy editable CRUD screens or database-backed dropdowns.
- Documentation: add schema mapping and implementation notes for role detection, storage configuration, API contracts, translation extension, and schema migration checklist.
- Verification: `pnpm run prisma:validate`, `pnpm run prisma:generate`, targeted tests, E2E admin access flows, translation parity checks, and production build.

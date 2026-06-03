## Context

The application already has Angular SSR, Express APIs, Prisma/PostgreSQL persistence, tenant-scoped RBAC, NgRx Signal Store usage, PrimeNG/Tailwind UI patterns, and English/Arabic localization. Accepted specs cover admin listing management and vehicle taxonomy for `CarMake`, `CarModel`, and `CarVariant`, but the requested define-vehicle admin workflow requires CRUD for additional attributes that are currently represented as Prisma enums or are missing from `schema.prisma`.

Current schema support:

- `CarMake` and `CarModel` are normalized tenant-scoped tables.
- `CarVariant` can represent trim names, but it stores `bodyType`, `fuelType`, and `transmission` as enums.
- `CarListing.condition` is an enum.
- There is no canonical engine table.
- RBAC roles exist through `User`, `Role`, and `UserRole`, with required roles including `admin` and `system-owner`.

This means a compliant implementation cannot hard-code dropdown lists in Angular. It must either add normalized catalog tables for the editable attributes or fail a schema compatibility check until the schema is migrated.

## Goals / Non-Goals

**Goals:**

- Centralize logged-in user and role hydration so Angular components, guards, and navigation read the same reactive auth/RBAC state.
- Persist sanitized user and role data to configurable browser storage and NgRx Signal Store without storing sensitive session secrets in localStorage.
- Add admin/system-owner-only navigation, lazy admin routes, route guards, and server authorization for all admin vehicle definition APIs.
- Provide separate CRUD screens for make, model, trim, transmission, engine, fuel type, body type, and condition using the existing Angular, PrimeNG, Tailwind v4, ngx-translate, and signal/store patterns.
- Normalize or verify canonical database tables for admin-editable vehicle attributes, including dependent make -> model -> trim dropdown loading.
- Provide a read-only users-and-roles admin utility with search/filtering.
- Add schema mapping documentation and a dev-time compatibility check for frontend expectations versus `prisma/schema.prisma`.

**Non-Goals:**

- No role editing UI in this change.
- No bulk import/export for vehicle definitions.
- No direct browser imports of Prisma, `pg`, `@prisma/adapter-pg`, generated Prisma client code, or server-only modules.
- No client-side authorization as the trusted enforcement layer; Angular checks are only UX and route-level protection.

## Decisions

### Use a single auth/RBAC session store as the client source of truth

Create or extend an NgRx Signal Store that holds the sanitized authenticated user DTO, normalized role names, derived booleans such as `isAdmin` and `isSystemOwner`, storage status, loading/error state, and last refresh timestamp. Auth services update this store after login, current-session fetch, token/session refresh, role refresh, and logout. Components and guards consume selectors/computed signals instead of recalculating role logic locally.

Alternative considered: allow each feature to parse roles from API responses. Rejected because navigation, guards, and admin UI would drift and produce inconsistent visibility.

### Persist only sanitized user and role state in configurable browser storage

Use a small storage adapter with `sessionStorage` as the recommended default and `localStorage` as an explicit configuration option. Persist the sanitized user DTO, role names, selected tenant context when safe, and metadata needed to rehydrate the store. Do not persist raw session tokens, CSRF token hashes, password hashes, TOTP secrets, reset OTPs, backup codes, or lockout internals.

Alternative considered: store the full server auth payload exactly as returned. Rejected because profile/auth DTOs can evolve and sensitive fields must never become browser-persisted by accident.

### Treat admin/system-owner as canonical high-level roles and still enforce permissions server-side

Angular route guards and navigation check normalized role names `admin` and `system-owner` for admin module visibility. Server APIs verify the authenticated session identity and tenant access, then enforce admin/system-owner role membership or the equivalent admin permission before executing mutations.

Alternative considered: rely only on route guards. Rejected because frontend checks can be bypassed and server authorization is mandatory.

### Add normalized vehicle definition tables for editable enum-backed attributes

To satisfy CRUD screens and database-backed dropdowns, introduce canonical tenant-scoped tables for editable attributes that are currently enums or missing: vehicle transmissions, engines, fuel types, body types, and conditions. Existing enum values should be seeded into the new tables during migration. `CarVariant` and `CarListing` should move toward foreign-key references where required for runtime selection lists, while compatibility mappers can preserve enum DTOs during incremental migration if needed.

Alternative considered: use Prisma enums as dropdown data. Rejected because enums are not database tables, cannot be edited through CRUD screens, cannot support per-tenant labels/metadata, and do not satisfy the requirement that dropdowns load from canonical tables.

### Keep make/model/trim hierarchical and tenant-scoped

Use `CarMake` for makes, `CarModel` for models, and `CarVariant` for trims. Models filter by selected make, trims filter by selected model, and all queries include tenant context. Trim records include references to the normalized body, fuel, transmission, and engine catalog records where the migration introduces those relations.

Alternative considered: create a separate `Trim` model unrelated to `CarVariant`. Rejected because the existing catalog/listing schema already uses `CarVariant` as the listing-level trim/variant relationship.

### Build admin definition screens from a reusable entity-management shell

Create a lazy-loaded admin vehicle definitions feature with a consistent table/search/form/dialog shell and per-entity configuration for fields, validation, dependencies, and API endpoints. Use PrimeNG controls, Tailwind v4 layout, Angular reactive forms/signals, and Lucide Angular icons for commands where available. Destructive actions use confirmation dialogs and focus restoration.

Alternative considered: write eight unrelated screens. Rejected because CRUD behavior, errors, accessibility, and localization would duplicate and drift.

### Put caching and schema checks on the server/dev side

Static catalog lists are cached in a server or Angular service layer with tenant-aware keys and TTLs. Mutations invalidate affected cache entries. A dev-time schema compatibility script reads `prisma/schema.prisma` or Prisma DMMF and compares expected models, fields, scalar types, enum usage, and relationships against a checked-in mapping document.

Alternative considered: hand-maintain screenshots or manual checklist only. Rejected because schema drift is likely and should be caught by a repeatable command.

## Risks / Trade-offs

- Schema migration touches listing/catalog relationships -> seed existing enum values, keep old enum fields during an incremental migration if needed, and add rollback notes for removing new foreign keys before dropping tables.
- Role names can vary in casing or aliases -> normalize role names centrally and document accepted canonical names.
- Browser storage can become stale -> revalidate the session on app start, clear persisted state on unauthorized responses, and refresh store state after role changes.
- Admin CRUD can expose cross-tenant data if filters are missed -> enforce tenant context in every server repository method and add tests for cross-tenant rejection.
- Reusable CRUD shells can hide entity-specific validation -> keep per-entity schemas explicit and include tests for make/model/trim dependency rules.
- Multi-instance caching can serve stale data if only in-memory cache is used -> use short TTLs, mutation invalidation, and document Redis/distributed cache as the production extension path if needed.

## Migration Plan

1. Add schema mapping documentation and a dev-time compatibility check that currently reports missing normalized engine/transmission/fuel/body/condition tables until migrations are present.
2. Add Prisma models and migrations for normalized vehicle definition tables, seed current enum values, and run `pnpm run prisma:validate` plus `pnpm run prisma:generate`.
3. Add server repositories, validation schemas, authorization helpers, audit logging, and admin API routes for user-role display and vehicle definition CRUD.
4. Add Angular auth/RBAC store persistence, storage adapter, rehydration flow, admin guard, admin navigation button, and localized access-denied states.
5. Add lazy admin screens, dependent dropdown services, cache invalidation, translations, accessibility announcements, and tests.
6. Roll back by disabling the admin routes/navigation first, then reverting schema migrations before removing compatibility mappers. Existing user/session data remains valid because persisted browser auth state can be cleared safely.

## Open Questions

- Should normalized catalog rows be global defaults copied per tenant, or tenant-owned rows seeded independently for every tenant?
- Should the `system-owner` role bypass tenant scoping for catalog administration, or manage only the currently selected tenant unless an explicit global admin screen is added?
- Should condition remain tied to listings only, or should it become a shared catalog used by both listing forms and vehicle request filters?

## Why

Admins currently type exterior and interior colors as free text in the vehicle editor, which creates inconsistent inventory data and prevents curated color labels, swatches, sorting, active/inactive control, and localized display. This change adds tenant-scoped color definition catalogs so system owners can manage exterior paint and interior cabin colors once, then reuse them from vehicle creation and editing dropdowns.

## What Changes

- Add admin/system-owner vehicle definition screens for exterior colors and interior colors using the existing admin definitions pattern, PrimeNG controls, Tailwind v4 styling, Lucide icons, and ngx-translate copy.
- Replace free-text exterior/interior color fields in the admin create/edit vehicle screen with searchable dropdowns that render color swatches, localized names, metadata, active-state filtering, and clear empty-state guidance.
- Add side-specific Prisma models and PostgreSQL tables for exterior and interior color definitions with tenant relationships, normalized names, optional color hex values, localized names, active status, sort order, timestamps, uniqueness, and indexes.
- Update `CarListing` relationships so `exteriorColorId` references the exterior color catalog and `interiorColorId` references the interior color catalog while preserving denormalized display-name fallbacks.
- Update showroom taxonomy/API DTOs so admin and listing forms receive `exteriorColors` and `interiorColors` separately instead of relying on one ambiguous color list.
- Add server validation, authorization, cache invalidation, audit events, and tenant isolation for the new color definitions.
- Add English and Arabic translation keys for the new screens, fields, states, validation, errors, dropdowns, and RTL-safe labels.
- Add focused tests for schema validation, definition CRUD, vehicle editor dropdown binding, invalid color rejection, translation parity, and RTL-safe UI behavior.

Non-goals:

- No bulk import/export for color catalogs.
- No public-facing color filter redesign beyond keeping listing/search data compatible with the new catalog fields.
- No browser-side Prisma imports; all database access remains in `src/server/**`.

## Capabilities

### New Capabilities
- `vehicle-color-definition`: Tenant-scoped exterior and interior vehicle color catalog management, including persistence, admin CRUD, swatch metadata, and vehicle form consumption.

### Modified Capabilities
- `admin-vehicle-definition`: Require the admin vehicle create/edit workflow to choose exterior and interior colors from active catalog dropdowns instead of free-text inputs.
- `vehicle-catalog-inventory`: Add side-specific color relationships to listing persistence and taxonomy responses while preserving listing display names and tenant isolation.
- `bilingual-rtl-localization`: Add translation parity and RTL layout requirements for the color definition screens and vehicle editor color selectors.

## Impact

- Angular app areas: `src/app/features/admin/definitions/**`, `src/app/features/admin/vehicles/**`, `src/app/core/showroom/**`, `src/app/features/admin/admin.routes.ts`, shared styles, and `public/i18n/{en,ar}.json`.
- Server/API areas: `src/server/showroom/validation.ts`, `src/server/showroom/services.ts`, `src/server/showroom/routes.ts`, DTO mappers, cache invalidation, audit logging, and tests under `src/server/showroom/**`.
- Database/schema: `prisma/schema.prisma` adds side-specific exterior/interior color models and listing relationships, with migration/backfill from the current generic color data where present.
- Generated types/scripts: run `pnpm run prisma:validate`, `pnpm run prisma:generate`, targeted tests, translation parity tests, and a production build after implementation.

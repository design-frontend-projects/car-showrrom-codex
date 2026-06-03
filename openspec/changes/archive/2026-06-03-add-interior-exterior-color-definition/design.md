## Context

The admin definitions area already exposes tenant-scoped CRUD for makes, models, trims, engines, transmissions, fuel types, body types, and conditions through one reusable Angular screen backed by `VehicleDefinitionEntity`, `VehicleDefinitionApiService`, and server handlers in `src/server/showroom/services.ts`. The admin vehicle editor currently uses free-text `exteriorColorName` and `interiorColorName` fields even though `CarListing` already has optional color ID columns and the existing `CarColor` model is too generic to express separate exterior paint and interior cabin catalogs.

The implementation must keep Prisma and PostgreSQL access server-only, use pnpm scripts for validation and build work, preserve tenant isolation, and keep English/Arabic translation keys in parity. Admin UI should remain consistent with the Angular, PrimeNG, Tailwind v4, ngx-translate, and Lucide Angular patterns already in the project.

## Goals / Non-Goals

**Goals:**

- Add separate exterior and interior color definition catalogs for admin/system-owner users.
- Persist both catalogs as tenant-scoped relational Prisma models with indexes, uniqueness, active state, sort order, swatch metadata, localized names, and listing relationships.
- Use the active color catalogs in the admin create/edit vehicle screen with searchable dropdowns and swatch previews.
- Preserve listing display names so existing list/detail cards can render stable color labels even when a catalog row is later renamed or deactivated.
- Add server validation, authorization, audit logging, cache invalidation, DTO updates, i18n, and focused tests.

**Non-Goals:**

- No bulk color import/export.
- No public search/filter UX redesign beyond keeping taxonomy/search data compatible.
- No direct browser imports of Prisma generated types, `pg`, `@prisma/adapter-pg`, or server-only modules.
- No role management changes beyond honoring existing admin/system-owner authorization.

## Decisions

### Use side-specific Prisma models instead of one shared color table

Add `VehicleExteriorColor` and `VehicleInteriorColor` models, mapped to `vehicle_exterior_colors` and `vehicle_interior_colors`. Each model includes `tenantId`, `name`, `normalizedName`, optional `hexCode`, `localizedNames`, `isActive`, `sortOrder`, `createdAt`, and `updatedAt`. Exterior colors can later add paint-specific metadata and interior colors can add cabin-material metadata without overloading one row type.

Alternative considered: keep the current `CarColor` model and add a `usage` enum. Rejected because a single table forces one shape for paint and cabin data, complicates uniqueness for names shared across both catalogs, and keeps the UI/API terminology ambiguous.

### Preserve listing color IDs and display-name fallbacks

Update `CarListing.exteriorColorId` to reference `VehicleExteriorColor` and `CarListing.interiorColorId` to reference `VehicleInteriorColor`. Keep `exteriorColorName` and `interiorColorName` as denormalized labels captured at save time. DTOs should expose the selected IDs plus stable display names for listing detail and preview views.

Alternative considered: remove display-name columns and always join catalog names. Rejected because historical listings should remain readable when a color is renamed, localized names change, or a color is deactivated.

### Extend the existing definition CRUD pattern

Add `exterior-colors` and `interior-colors` to `VehicleDefinitionEntity`, `DEFINITION_CONFIGS`, route validation, server switch statements, and Angular API typings. Reuse the existing admin definitions index and entity screen, adding field support for swatch/hex and localized name metadata where needed.

Alternative considered: build dedicated one-off color pages. Rejected because the existing definition shell already handles admin routing, search, inactive filters, dialogs, validation, and audit-friendly workflows.

### Make vehicle editor selectors catalog-backed and visual

Replace the two text inputs with `p-select` controls backed by active `taxonomy.exteriorColors` and `taxonomy.interiorColors`. Each option renders a compact color swatch, localized display name when available, canonical name fallback, and optional metadata. The selected values store catalog IDs, and the submit payload includes both IDs and display names.

Alternative considered: keep text fields with autocomplete suggestions. Rejected because free text still allows non-canonical values and does not satisfy the requirement to use admin-defined colors as dropdowns.

### Validate catalog references server-side

On create/update, the server MUST verify that any submitted exterior color belongs to the current tenant, is an exterior color, and is active for new selections. The same rule applies to interior color IDs. The server should reject cross-tenant IDs and invalid side usage with existing localized showroom error patterns.

Alternative considered: rely on dropdown contents. Rejected because frontend constraints are not a security boundary.

### Migrate existing generic color data safely

If `car_colors` contains data, the migration should backfill both new side-specific tables from it where existing listings reference those IDs. Existing exterior references populate the exterior table; existing interior references populate the interior table. If the same generic color is used by both sides, the new tables can reuse the same UUID in each table because table-level primary keys are independent. After backfill, listing foreign keys point to the new tables and the old generic relation can be removed or left only as an implementation fallback until a cleanup migration.

Alternative considered: drop existing color data. Rejected because listings can already store color IDs.

## Risks / Trade-offs

- Existing listings may reference generic color rows that are missing or inconsistent -> Backfill only referenced rows, preserve name fallback columns, and make color IDs optional during migration.
- Two tables duplicate basic color fields -> Duplication buys clear side-specific semantics, simpler validation, and future metadata flexibility.
- Active filters can hide deactivated colors on edit -> Existing selected inactive colors should still render in edit context while new dropdown searches default to active rows.
- Localized dynamic labels can drift -> Store `localizedNames` as JSON, use canonical `name` fallback, and cover translation key parity for UI chrome separately.
- Cache can serve stale taxonomy after mutation -> Invalidate tenant catalog cache after color create/update/deactivate, matching existing definition behavior.

## Migration Plan

1. Add Prisma models, relations, unique constraints, and indexes for exterior and interior color definitions in `prisma/schema.prisma`.
2. Create a migration that creates the new tables, backfills from `car_colors` where present, updates `car_listings` foreign keys, and preserves `exterior_color_name` and `interior_color_name`.
3. Run `pnpm run prisma:validate` and `pnpm run prisma:generate`.
4. Update server validation, DTOs, definition services, taxonomy responses, listing create/update validation, cache invalidation, and tests.
5. Update Angular models, definition configuration, vehicle editor form controls, payload builder, preview, translations, and tests.
6. Roll back by reverting vehicle editor selectors to name-only fields, dropping new listing foreign keys, and restoring the old generic color relation before dropping the new color tables.

## Open Questions

- Should interior colors include a first-class `material` field now, or remain a future metadata extension?
- Should deactivated colors be selectable when editing a listing that already uses them, or only displayed as locked legacy selections?

## 1. Schema And Migration

- [x] 1.1 Add `VehicleExteriorColor` and `VehicleInteriorColor` models to `prisma/schema.prisma` with tenant relations, normalized names, hex code, localized names, active state, sort order, timestamps, uniqueness, and indexes.
- [x] 1.2 Update `Tenant` and `CarListing` relations so exterior and interior color IDs reference the side-specific color models.
- [x] 1.3 Create a Prisma migration that creates the side-specific color tables, backfills referenced legacy `car_colors` data when present, updates listing foreign keys, and preserves display-name fallback columns.
- [x] 1.4 Run `pnpm run prisma:validate` and resolve schema errors.
- [x] 1.5 Run `pnpm run prisma:generate` and keep generated Prisma usage inside server-only code paths.

## 2. Server Validation And DTOs

- [x] 2.1 Extend `VehicleDefinitionEntity` validation to include `exterior-colors` and `interior-colors`.
- [x] 2.2 Add color definition validation for name, optional hex code, localized names, active state, and sort order.
- [x] 2.3 Add DTO mappers for exterior and interior color definitions, including localized names, hex code, active state, sort order, and timestamps.
- [x] 2.4 Update showroom taxonomy DTOs to return separate `exteriorColors` and `interiorColors` arrays.
- [x] 2.5 Update listing detail and summary DTOs to expose selected color IDs and stable exterior/interior color display names where needed.

## 3. Server Services And APIs

- [x] 3.1 Extend definition list/create/update/deactivate services to support exterior and interior color catalogs with tenant-scoped filters and ordering.
- [x] 3.2 Add server-side validation that listing create/update rejects cross-tenant, inactive, missing, or wrong-side color IDs.
- [x] 3.3 Ensure existing selected inactive colors can be loaded for edit views without making inactive colors available for unrelated new selections.
- [x] 3.4 Add audit events for exterior and interior color definition create, update, and deactivate actions.
- [x] 3.5 Invalidate tenant catalog and definition caches after color definition mutations.
- [x] 3.6 Update Express route parsing so `/api/showroom/admin/definitions/exterior-colors` and `/api/showroom/admin/definitions/interior-colors` use the new schemas.

## 4. Angular Models And Data Layer

- [x] 4.1 Extend `showroom.models.ts` with exterior/interior color DTOs, taxonomy arrays, and admin vehicle color ID/display-name fields.
- [x] 4.2 Extend `VehicleDefinitionEntity`, `VehicleDefinitionInputDto`, and related definition record types for exterior and interior colors.
- [x] 4.3 Update `VehicleDefinitionApiService` and catalog consumers for the new color entities without importing server-only Prisma code.
- [x] 4.4 Update admin vehicle form utilities to read/write `exteriorColorId`, `interiorColorId`, and display-name fallbacks from selected catalog rows.
- [x] 4.5 Add helper logic for localized dynamic color labels with canonical-name fallback.

## 5. Admin Definition UI

- [x] 5.1 Add exterior and interior color cards to the admin definitions dashboard with Lucide icons and translated copy.
- [x] 5.2 Extend definition configuration to include name, hex swatch, localized names, sort order, and active state fields for color catalogs.
- [x] 5.3 Add field rendering support for color swatches and localized-name metadata in the reusable definition form.
- [x] 5.4 Render color definition table rows with swatches, names, metadata, active state, edit, and deactivate actions.
- [x] 5.5 Verify the color definition screens work at `/admin/definitions/exterior-colors` and `/admin/definitions/interior-colors`.

## 6. Vehicle Editor UI

- [x] 6.1 Replace free-text exterior and interior color inputs in the admin vehicle editor with searchable PrimeNG dropdowns.
- [x] 6.2 Render dropdown options and selected values with swatches, localized labels, canonical fallback names, and clear controls.
- [x] 6.3 Update dependent loading, preview, and confirmation modal behavior so selected color labels are reflected without page reloads.
- [x] 6.4 Handle empty color catalogs with actionable translated empty states that direct admins to definitions.
- [x] 6.5 Preserve readable display of inactive legacy colors when editing existing listings.

## 7. Localization And RTL

- [x] 7.1 Add English translation keys for color definition screens, fields, validation, actions, states, dropdowns, toasts, and accessibility announcements.
- [x] 7.2 Add matching Arabic translation keys for every new English key.
- [x] 7.3 Replace remaining hardcoded admin vehicle editor color labels and messages with translation keys.
- [x] 7.4 Check RTL layout for color definition tables, dialogs, swatches, and vehicle editor dropdowns at narrow and desktop widths.

## 8. Tests

- [x] 8.1 Add server tests for color definition authorization, validation, duplicate handling, CRUD, audit events, cache invalidation, and tenant isolation.
- [x] 8.2 Add server tests for listing create/update rejection of invalid, cross-tenant, inactive, or wrong-side color IDs.
- [x] 8.3 Add Angular unit tests for definition configuration, form normalization, color label fallback, and vehicle payload generation.
- [x] 8.4 Add component tests for color definition screens and vehicle editor dropdown rendering, clear behavior, and inactive legacy display.
- [x] 8.5 Extend translation parity tests to cover all new color keys.

## 9. Verification

- [x] 9.1 Run `pnpm run prisma:validate`.
- [x] 9.2 Run `pnpm run prisma:generate`.
- [x] 9.3 Run targeted server and Angular tests for this change with `pnpm test -- --watch=false`.
- [x] 9.4 Run `pnpm run build:prod`.
- [x] 9.5 Start the local app and verify admin color definition CRUD plus create/edit vehicle color dropdowns in English, Arabic, LTR, and RTL.

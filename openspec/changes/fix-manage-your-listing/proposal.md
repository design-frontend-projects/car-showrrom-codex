## Why

Client listing creation from `/client/my-listings` can fail even when the user fills the visible form because the required listing `condition` value is not reliably initialized from the database-backed condition options. This blocks guests who sign in to create their first listing and produces a server validation response for a field the UI does not clearly expose as invalid.

## What Changes

- Ensure the client listing form initializes `condition` from active database-backed condition options instead of relying on a hard-coded default that may not match the loaded option set.
- Keep the condition dropdown required and disable listing submission until a valid condition option is selected.
- Improve client-side validation/error display so server `condition` validation errors map back to the visible condition control.
- Align listing persistence with the canonical condition catalog by resolving and saving the matching `conditionId` when creating or updating listings.
- Add focused tests for the client form default condition behavior and server listing persistence/validation.

Non-goals:

- No redesign of the client listing page or admin vehicle definition screens.
- No subscription or active-listing-limit changes.
- No replacement of existing enum-based public filtering or catalog route behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `client-listing-management`: Require the client Add Vehicle form to submit only condition values that are loaded from active database-backed condition options and to display field-level condition validation feedback.
- `vehicle-catalog-inventory`: Require listing create/update persistence to keep the enum `condition` and canonical `conditionId` relationship aligned for valid tenant-scoped condition catalog rows.

## Impact

- Angular app areas: `src/app/features/client/client-listings-page.ts`, `src/app/features/client/client-listings-page.spec.ts`, and existing showroom DTO/service types under `src/app/core/showroom/**` if needed.
- Server/API areas: `src/server/showroom/services.ts`, server validation/error handling paths, and focused showroom service tests.
- Database/schema: no new Prisma model is expected; implementation should use the existing `VehicleCondition` model and `CarListing.conditionId` relation. A small data repair or migration may be needed only if existing rows can have a valid enum `condition` with a missing `condition_id`.
- Dependencies: no new runtime dependency.
- Verification: `pnpm run prisma:validate`, `pnpm run prisma:generate` if Prisma types are affected, targeted Angular/server tests, and `pnpm run build:prod`.

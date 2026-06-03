## Context

The client listing page at `/client/my-listings` already loads makes and conditions from the showroom option APIs, but the draft model starts with a hard-coded `condition: 'USED'`. If the loaded condition options are empty, inactive, differently configured, or not yet applied to the form state, the UI can submit a value the server rejects as `showroom.validation.invalid_value`.

The database has both the enum `CarListing.condition` and the canonical `CarListing.conditionId` relation to `VehicleCondition`. Current listing writes persist the enum value but do not resolve the matching catalog row, so persisted listings can drift from the canonical condition catalog that powers dropdowns.

## Goals / Non-Goals

**Goals:**

- Initialize the client listing form condition from the active condition option set returned by the server.
- Prevent submission when a required condition is missing or not part of the loaded options.
- Preserve the existing condition enum contract used by public filters and inventory grouping.
- Resolve and persist `conditionId` from the selected condition code during listing create/update.
- Keep browser code free of Prisma or database imports.

**Non-Goals:**

- No redesign of the listing management page.
- No new listing condition taxonomy model.
- No changes to public used/new inventory scope rules.
- No changes to authentication, guest registration, or active listing limits.

## Decisions

1. Use database-backed condition option codes as the client form source of truth.

   The Angular form should start with an empty condition and set it only after active condition options load. If `USED` exists and is active it can be selected as the preferred default; otherwise the first active option can be selected. Alternative considered: keep the hard-coded `USED` default and only fix server handling. That would still allow the UI to display a required select whose value is not part of the option list.

2. Keep `condition` as the API payload field and enum used for filtering.

   The API already exposes `condition` across listing DTOs, admin filters, route resolvers, and public inventory counters. Adding a browser-facing `conditionId` payload would increase churn and duplicate the current select semantics. The server can resolve the catalog row from the submitted enum code inside the existing server-only service layer.

3. Resolve `conditionId` in server-only listing persistence.

   `createListing` and `updateListing` should look up an active tenant-scoped `VehicleCondition` by `code = input.condition`. On success, they should write both `condition` and `conditionId`. On failure, they should return a validation error on `condition`. This keeps Prisma/PostgreSQL access under `src/server/**`.

4. Repair existing drift with a narrow migration or data script only if needed.

   The implementation should first check whether current migrations already backfill `condition_id`. If existing rows can still be missing it, add a small idempotent migration that sets `car_listings.condition_id` from `vehicle_conditions.code` for the same tenant.

## Risks / Trade-offs

- Missing condition seed data -> Return a clear `condition` validation error and keep the form disabled until options load.
- Inactive condition code selected from a stale UI -> Server lookup rejects it before persistence.
- Existing rows with null `condition_id` -> Idempotent backfill keeps current enum values readable while restoring the catalog relation.
- Generated Prisma client drift -> Run Prisma validate/generate when schema or migrations are touched.

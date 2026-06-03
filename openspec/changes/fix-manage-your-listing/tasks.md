## 1. Data And Server Persistence

- [x] 1.1 Inspect existing migrations/data paths to confirm whether `car_listings.condition_id` can be null for rows with a valid enum `condition`.
- [x] 1.2 Add a narrow idempotent Prisma migration only if existing data can need a `condition_id` backfill from `vehicle_conditions.code`.
- [x] 1.3 Add a server-only helper that resolves an active tenant-scoped `VehicleCondition` by submitted condition code and returns a field-level `condition` validation error when missing.
- [x] 1.4 Update listing create and update persistence to write both `condition` and the resolved `conditionId`.

## 2. Client Listing Form

- [x] 2.1 Initialize the client listing draft with no hard-coded condition until active condition options load.
- [x] 2.2 Select the preferred active condition code from loaded options and keep submission disabled when no valid condition is available.
- [x] 2.3 Include condition validity in `canSave()` and preserve draft values when server validation fails.
- [x] 2.4 Surface `fieldErrors.condition` clearly in the existing listing form validation area.

## 3. Tests

- [ ] 3.1 Add or update Angular tests for condition option initialization, disabled submission without a valid condition, and condition field error display.
- [ ] 3.2 Add or update server tests for listing creation/update persisting `conditionId` and rejecting condition codes without an active catalog match.

## 4. Verification

- [ ] 4.1 Run `pnpm run prisma:validate`.
- [ ] 4.2 Run `pnpm run prisma:generate` if Prisma schema or migrations changed generated types.
- [ ] 4.3 Run targeted client/server tests for this change.
- [ ] 4.4 Run `pnpm run build:prod`.

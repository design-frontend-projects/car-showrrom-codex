## Why

Used Cars, New Cars, Add Vehicle, Edit Vehicle, and Define Vehicle Data screens currently mix routing, loading, static option lists, and UI state in component code, which causes over-fetching and makes dependent dropdown behavior inconsistent. This change establishes a database-backed loading contract so each route fetches only the data it needs before rendering and every vehicle workflow reads canonical Prisma-backed definitions.

## What Changes

- Split Used Cars and New Cars routing into explicit route contracts with resolvers that load the correct listing dataset before activation.
- Ensure Used Cars and New Cars fetch only their relevant database-backed listing condition set instead of loading broad taxonomy/listing data for both sections.
- Replace static dropdowns in Add Vehicle, Edit Vehicle, client listing creation, admin vehicle inventory filters, public catalog filters, and Define Vehicle Data screens with asynchronous option loaders backed by Prisma models and server DTOs.
- Add dependent dropdown loading for make -> model -> trim and catalog-backed trim attributes, with debounced parent-change triggers, stale-response protection, empty states, retry behavior, and tenant-aware caching.
- Introduce declarative dropdown dependency configuration for path variables, query parameters, service method names, mapping rules, search fields, and cache policies so vehicle forms and definition forms can share the same loader strategy.
- Enhance Add Vehicle and Edit Vehicle flows with server-side validation feedback, field-level errors, conditional dependent fields, and retryable save failures.
- Move Define Vehicle Data filtering, sorting, keyword search, range filtering, and pagination to the backend so Angular sends filter parameters and renders server-processed results.
- Keep all database access in `src/server/**` and source option/listing data from `prisma/schema.prisma` models through HTTP DTOs.

Non-goals:

- No browser-side Prisma imports or generated Prisma client usage.
- No redesign of unrelated landing, auth, RBAC, or media upload workflows beyond the data-loading changes needed by vehicle forms.
- No new package manager or UI library migration; implementation must continue using pnpm, Angular, PrimeNG, Tailwind v4, and Lucide Angular.

## Capabilities

### New Capabilities
- `route-resolved-vehicle-loading`: Route-level resolver, prefetch, loading, error, and cache behavior for vehicle catalog pages and admin vehicle workflows.

### Modified Capabilities
- `public-vehicle-discovery`: Require Used Cars and New Cars routes to request only matching listing datasets and database-backed filter options, with server-side search/filter semantics.
- `admin-vehicle-definition`: Replace static admin vehicle form/filter dropdowns with dynamic database-backed loaders, dependent field behavior, route-resolved edit/create data, and server validation feedback.
- `client-listing-management`: Replace static client Add Vehicle dropdowns with dynamic database-backed loaders and dependent make/model/trim behavior.
- `vehicle-catalog-inventory`: Require taxonomy, definition, listing, and option APIs to source values from Prisma-backed vehicle definition models with tenant isolation, cache invalidation, and relationship validation.
- `server-database-access`: Extend the server-only data boundary to cover resolver-backed option endpoints, server-side definition filtering, and optimized listing queries.

## Impact

- Angular app areas: `src/app/app.routes.ts`, `src/app/features/landing/pages/catalog-page.ts`, `src/app/features/admin/admin.routes.ts`, `src/app/features/admin/vehicles/**`, `src/app/features/admin/definitions/**`, `src/app/features/client/client-listings-page.ts`, `src/app/core/showroom/**`, and shared loading/error utilities.
- Server/API areas: `src/server/showroom/routes.ts`, `src/server/showroom/services.ts`, `src/server/showroom/repositories.ts`, `src/server/showroom/validation.ts`, `src/server/showroom/cache.ts`, DTO mappers, and related server tests.
- Database/schema: uses existing Prisma models including `CarMake`, `CarModel`, `CarVariant`, `VehicleEngine`, `VehicleTransmission`, `VehicleFuelType`, `VehicleBodyType`, `VehicleCondition`, `VehicleExteriorColor`, `VehicleInteriorColor`, and `CarListing`; adds migrations only if implementation discovers a missing model/index required for the specified filters.
- API contracts: adds or extends query DTOs for condition-scoped listing routes, option search, dependent option loading, definition pagination/sorting/range filtering, and field-level validation errors.
- Verification: `pnpm run prisma:validate`, `pnpm run prisma:generate`, targeted unit/server tests, Angular route/form tests, and `pnpm run build:prod`.

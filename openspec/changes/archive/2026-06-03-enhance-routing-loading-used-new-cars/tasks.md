## 1. API Contracts and Server Queries

- [x] 1.1 Add Angular-safe DTO types for inventory scope, option query/results, definition list result envelopes, route resolver payloads, and field-level validation errors in `src/app/core/showroom/showroom.models.ts`.
- [x] 1.2 Extend showroom validation schemas for inventory scope, option search, selected-id inclusion, definition pagination, definition sorting, parent filters, and supported range filters.
- [x] 1.3 Add server repository helpers for new/used condition grouping so public route queries and inventory counters share the same active-visibility semantics.
- [x] 1.4 Add focused option query service methods for makes, models by make, trims by model, engines, transmissions, fuel types, body types, conditions, exterior colors, and interior colors.
- [x] 1.5 Change definition list service responses from arrays to paginated envelopes with server-side search, active-state filtering, parent filtering, sorting, and totals.
- [x] 1.6 Update Express showroom routes to expose scoped listing queries, focused option queries, and paginated definition queries while preserving CSRF rules for mutations.
- [x] 1.7 Update cache keys and invalidation for tenant, entity, query, dependency, active-state, and selected-id option results.

## 2. Angular Data Loading Infrastructure

- [x] 2.1 Add a route resolver module for public catalog routes, admin vehicle overview, admin vehicle create/edit, and admin definition entity pages.
- [x] 2.2 Add a shared vehicle option loader service with declarative field dependency configuration, debouncing, stale-response protection, retry state, cache policy, and response mapping.
- [x] 2.3 Update `CatalogApiService`, `AdminVehicleApiService`, and `VehicleDefinitionApiService` to call the new scoped listing, option, and paginated definition contracts.
- [x] 2.4 Add route-level error/loading helper state so resolver failures show recoverable UI without stale data.

## 3. Public Catalog Routes

- [x] 3.1 Update `/used-cars` and `/new-cars` route definitions with inventory-scope metadata and catalog resolvers.
- [x] 3.2 Refactor `CatalogPage` to initialize results and option state from resolved route data rather than always calling full taxonomy in `ngOnInit`.
- [x] 3.3 Replace public catalog static condition and nested taxonomy dropdowns with async database-backed option loaders.
- [x] 3.4 Ensure filter changes preserve the active route scope and send only query parameters to the server.
- [x] 3.5 Add tests proving Used Cars does not fetch New Cars data, New Cars does not fetch Used Cars data, and scoped pagination totals remain server-provided.

## 4. Admin Vehicle Workflows

- [x] 4.1 Wire admin vehicle overview, create, and edit routes to resolvers that load only the data needed for each screen.
- [x] 4.2 Replace admin vehicle editor hardcoded condition, fuel type, transmission, and body type options with database-backed option loaders.
- [x] 4.3 Replace make/model/trim selection in the admin vehicle editor with dependent async loaders that clear stale child values and preserve inactive selected edit values.
- [x] 4.4 Project server validation field errors into admin vehicle form controls while preserving form state after failed create/update attempts.
- [x] 4.5 Update admin vehicle overview filters to use database-backed condition/status-compatible option data where applicable.
- [x] 4.6 Add admin vehicle workflow tests for route resolution, dependent dropdown behavior, inactive selected fallback, validation projection, and retryable save failures.

## 5. Client Listing Workflow

- [x] 5.1 Replace client listing form static condition and taxonomy dropdowns with database-backed option loaders.
- [x] 5.2 Add dependent make/model/trim loading to the client Add Vehicle form with stale child clearing and debounced requests.
- [x] 5.3 Surface server validation field errors in the client Add Vehicle form and keep draft values after failed submissions.
- [x] 5.4 Add client listing tests for async option loading, dependent dropdown behavior, server validation feedback, and retry preservation.

## 6. Define Vehicle Data Workflow

- [x] 6.1 Update `VehicleDefinitionApiService` and definition models to consume paginated server result envelopes.
- [x] 6.2 Refactor `AdminDefinitionEntityPage` to send filter, search, sort, parent, range, page, and page-size parameters instead of loading all records for client-side processing.
- [x] 6.3 Replace definition dialog option preloads with declarative option-loader dependencies for make/model/trim-related fields.
- [x] 6.4 Add loading, empty, error, retry, and pagination UI states for definition result envelopes.
- [x] 6.5 Add server and Angular tests for definition server-side filtering, sorting, pagination, parent filters, empty states, and cache invalidation.

## 7. Verification and Documentation

- [x] 7.1 Update docs or module READMEs that describe vehicle loading, definition APIs, and dropdown dependency configuration.
- [x] 7.2 Verify browser code under `src/app/**` does not import Prisma Client, `@prisma/adapter-pg`, `pg`, or server-only showroom modules.
- [x] 7.3 Run `pnpm run prisma:validate`.
- [x] 7.4 Run `pnpm run prisma:generate`.
- [x] 7.5 Run targeted server and Angular tests for showroom routing, definitions, listings, and validation.
- [x] 7.6 Run `pnpm run build:prod`.

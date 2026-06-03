## Context

The app is an Angular SSR showroom with Express APIs and Prisma/PostgreSQL persistence. Public catalog routes currently reuse one `CatalogPage` for `/used-cars` and `/new-cars`, with the component loading full taxonomy and then loading listings after navigation. Admin and client vehicle forms still include static enum option arrays for condition, fuel type, transmission, and body type even though `prisma/schema.prisma` now includes normalized vehicle definition tables for those values. Define Vehicle Data screens call simple list endpoints and perform only shallow query filtering.

The current server boundary is good: Angular services call HTTP DTO endpoints and Prisma access stays under `src/server/**`. This change keeps that boundary and moves the inconsistency out of components by adding route resolvers, focused option endpoints, server-side definition filtering, and a reusable dependent-option loading service.

## Goals / Non-Goals

**Goals:**

- Resolve Used Cars, New Cars, admin vehicle overview, admin vehicle editor, and definition screen data before route activation where route-level blocking improves UX and correctness.
- Fetch only the data required for the requested route: Used Cars resolves used-condition listings, New Cars resolves new-condition listings, and forms load focused option sets instead of full nested taxonomy unless a screen explicitly needs it.
- Replace hardcoded vehicle dropdown lists with database-backed asynchronous options for makes, models, trims, engines, transmissions, fuel types, body types, conditions, exterior colors, and interior colors.
- Provide a declarative dependency configuration for dropdowns and multi-selects, including parent field keys, service methods, path/query mapping, response mapping, debounce, empty state, cache key, and invalidation rules.
- Move Define Vehicle Data filtering, sorting, search, and pagination into server query DTOs and Prisma queries.
- Preserve PrimeNG/Tailwind v4/Lucide Angular UI patterns and use pnpm for verification.

**Non-Goals:**

- No direct Prisma imports in Angular browser code.
- No replacement of PrimeNG controls or existing Angular routing with another framework.
- No broad UI redesign beyond loading, empty, error, retry, and field-feedback states needed for this workflow.
- No distributed cache dependency; in-memory tenant-aware caching remains acceptable unless production requirements later demand Redis or another shared cache.

## Decisions

### Use Angular route resolvers for page-critical data

Add `ResolveFn` implementations under `src/app/core/showroom` or the owning feature folder for catalog route data, admin vehicle list data, admin vehicle edit detail data, and definition screen list data. Routes pass mode metadata such as `vehicleConditionScope: 'used' | 'new'` and resolver output becomes the component's initial signal state through `ActivatedRoute.data`.

Alternative considered: keep all loading in `ngOnInit`. Rejected because it allows navigation to complete before required data is known, causes avoidable loading flashes, and makes route errors harder to handle consistently.

### Make Used Cars and New Cars condition-scoped at the API query layer

Represent New Cars as `condition=NEW` and Used Cars as `condition in CERTIFIED_PRE_OWNED,USED,DAMAGED` or an explicit `inventoryType=used` query parameter that the server expands. The route resolver sends the relevant scope and the server builds one Prisma query for that scope. Public counters continue using active listing visibility semantics.

Alternative considered: fetch all active listings once and split on the client. Rejected because it over-fetches, breaks pagination counts, and cannot scale with server-side sorting/filtering.

### Replace full taxonomy fetches with focused option loaders

Keep `/api/showroom/taxonomy` for screens that truly need a complete snapshot, but introduce or extend option endpoints for focused lists: makes, models by make, variants by model, and catalog entities with search, active-only filtering, pagination, and selected-id inclusion. Components should request each field's options asynchronously through a shared option-loader service and cache by tenant, entity, search term, dependency values, and active-state policy.

Alternative considered: expand the taxonomy endpoint with every possible option and nested relationship. Rejected because it repeats the current over-fetching problem and makes dependent dropdowns reload more data than needed.

### Use a declarative dependent-option loader service

Create a configuration-driven loader that accepts field definitions for parent keys, child keys, debounce intervals, service method names, query parameters, path variables, response mapping, cache policy, and fallback behavior. Vehicle editor, client listing creation, catalog filters, and definition dialogs reuse the same service. The service cancels or ignores stale responses when parent values change.

Alternative considered: wire each dependency manually in every component. Rejected because make/model/trim, definition model/trim, and catalog filters would duplicate behavior and diverge on errors, retries, and empty states.

### Keep validation authoritative on the server and project field errors to Angular

Existing Zod validation remains the authoritative mutation validation layer. Add or refine schemas so server errors include stable field keys for taxonomy hierarchy, inactive option references, numeric ranges, required fields, and cross-field rules. Angular forms keep immediate client feedback for ergonomics but display server field errors after create/update attempts.

Alternative considered: rely on client validators only. Rejected because listing mutations can be called directly and tenant-scoped taxonomy relationships must be verified against the database.

### Move definition filtering to server-side paginated query contracts

Change definition list responses from raw arrays to result envelopes with `items`, `page`, `pageSize`, `total`, and `pageCount`. Server validation accepts keyword, active state, sort field/direction, parent filters such as `makeId`/`modelId`, and supported numeric/date ranges. Prisma queries apply tenant filters first, then search/filter/sort/pagination using indexed fields where available.

Alternative considered: keep returning arrays and filter in Angular. Rejected because definition tables can grow, client filtering hides total counts, and pagination cannot be correct without server processing.

## Risks / Trade-offs

- Resolver failures can block navigation -> Provide route-level error UI and retry actions, and reserve resolvers for data that is required to render the page correctly.
- Option caches can serve stale definition values after admin edits -> Invalidate tenant/entity cache keys after definition mutations and listing mutations that affect counters.
- Condition-scoped public routes can drift from inventory counters -> Share server helper logic for active visibility and new/used condition grouping.
- Existing components expect arrays from definition endpoints -> Update DTOs and API services in one pass with focused tests for all definition screens.
- Debounced dependent loaders can feel delayed -> Use short default debounce values, immediate fetch for selected parent values from resolvers, and visible loading indicators in PrimeNG selects.
- Inactive options on edit forms can disappear -> Include selected inactive IDs as read-only fallback options while preventing new selections of inactive records.

## Migration Plan

1. Add route resolver and option-loader DTO types in Angular-safe showroom models.
2. Extend server validation/query DTOs for listing scopes, option search, definition pagination, sorting, and range filters.
3. Add focused server service/repository methods backed by Prisma models and tenant-aware cache keys.
4. Wire `/used-cars`, `/new-cars`, admin vehicle, client listing, and definition routes to resolvers and initialize components from route data.
5. Replace static option arrays in catalog, admin vehicle, client listing, admin inventory filters, and definition dialogs with database-backed option loaders.
6. Update tests for resolver data loading, no over-fetching between Used/New routes, dependent dropdown behavior, server filtering, field-error projection, and cache invalidation.
7. Verify with `pnpm run prisma:validate`, `pnpm run prisma:generate`, targeted tests, and `pnpm run build:prod`.

Rollback is code-only unless implementation adds missing indexes or migrations. If a migration is added, rollback by reverting routes/components first, then reverting the migration after confirming no new data depends on it.

## Open Questions

- Should the public API expose `inventoryType=new|used` or keep condition arrays explicit in route queries?
- Should definition list pagination default to 20 rows or preserve the current all-record behavior for very small catalogs until filters are applied?
- Should cached option values be shared through `ShowroomStore`, a dedicated `VehicleOptionStore`, or service-level signals only?

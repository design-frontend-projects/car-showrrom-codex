## Context

The app already has an Angular 22 SSR frontend, PrimeNG/Tailwind styling, Express showroom APIs, Prisma 7 PostgreSQL persistence, tenant-scoped RBAC, public listing search, client listing management, and listing image upload endpoints. The requested admin workflow should build on the existing `CarListing`, `CarListingImage`, `CarMake`, `CarModel`, `CarVariant`, and `CarColor` models from `prisma/schema.prisma` rather than creating a parallel vehicle definition model.

Current client listing screens use template-driven forms and single-file upload. The admin workflow needs a richer, signal-oriented editing surface, a staged image queue, a live listing preview, status publishing controls, and public landing counters for active new and used inventory.

Browser code must stay under `src/app/**` and must not import Prisma, PostgreSQL adapters, server file APIs, or generated Prisma client code. Server-only query, upload, and cache logic belongs under `src/server/**`.

## Goals / Non-Goals

**Goals:**

- Add `/admin/vehicles`, `/admin/vehicles/create`, and `/admin/vehicles/edit/:id` routes behind the existing auth guard and showroom permissions.
- Provide a professional admin form with signal-derived preview state, Angular validators, PrimeNG controls, Tailwind v4 layout, responsive behavior, loading states, and a final preview modal.
- Persist admin listings through optimized server service/repository methods that strictly follow `prisma/schema.prisma` relations and preserve price/model history rules.
- Upload images after the listing record exists, link each image to the listing, persist sort order and primary image, and handle partial upload failure predictably.
- Expose cached active new/used counters for the landing page and invalidate them after relevant listing mutations.
- Add focused tests for client-side validation/image queue behavior and server-side query/endpoint behavior.
- Add READMEs for the admin vehicle module and reusable submodules.

**Non-Goals:**

- No new vehicle taxonomy management UI.
- No replacement of existing client listing management behavior.
- No new subscription, billing, lead assignment, reservation, checkout, or financing workflow.
- No browser-side direct access to Prisma, PostgreSQL, filesystem paths, or server-only environment variables.

## Decisions

### Use the existing listing schema as the source of truth

Admin-created vehicles will be stored as `CarListing` rows with related `CarMake`, `CarModel`, `CarVariant`, optional `CarColor`, `CarListingImage`, `CarPriceHistory`, and `CarModelHistory` rows. "New cars" and "used cars" map to `CarListingCondition.NEW`, `CarListingCondition.CERTIFIED_PRE_OWNED`, and `CarListingCondition.USED`; public counters count only `CarListingStatus.ACTIVE` rows.

Alternative considered: add a new `VehicleDefinition` table. Rejected because the current schema already has listing, status, condition, media, tenant, seller, taxonomy, and history concepts, and duplicating them would split search and publishing behavior.

### Add admin endpoints as aliases around admin-aware services

The server will add `/api/showroom/admin/vehicles` endpoints for list, create, preview/read, update, status transition, delete/archive, image upload, image order, primary image, and image delete. The implementation should share lower-level service/repository helpers with existing client listing endpoints, but must use admin permission checks and skip the client active-listing limit when the actor has `SHOWROOM_PERMISSIONS.adminManage` or equivalent admin showroom capability.

Alternative considered: reuse `/client/listings` directly in the admin UI. Rejected because the URL, permission model, list scope, active limit, and admin dashboard semantics differ enough to justify explicit admin endpoints.

### Keep signal state in the feature layer and DTO I/O in core services

Create an `AdminVehicleApiService` under `src/app/core/showroom` for HTTP calls and place screen state/components under `src/app/features/admin/vehicles`. The form component should use Angular `FormGroup` validators for field validation and signals/computed values for preview state, derived discount, selected taxonomy, image queue state, and submit readiness.

Alternative considered: introduce a global NgRx Signal Store for admin vehicles immediately. Rejected for the first implementation because the workflow is route-local and can be kept simpler with component-level signals and an injectable form/queue helper. A store can be introduced later if multiple admin pages need shared state.

### Stage images locally, then persist sequentially with progress

The create flow will first create/update the listing, then upload queued images one at a time to preserve stable progress and ordering. After uploads complete, the client will submit the final image order and primary image choice. On edit, existing persisted images and new queued files are represented in the same UI but with distinct typed states.

Alternative considered: upload all selected images immediately before saving the listing. Rejected because `CarListingImage` requires a listing relationship and immediate orphan handling would add complexity.

### Use in-memory cache with clear invalidation first

Implement a small server-only in-memory cache for active new/used counters and frequently requested listing preview/list data. Cache entries must be tenant-scoped and invalidated after create, update, status transition, delete/archive, image mutations that affect preview media, and reorder/primary changes. Redis can replace this implementation later behind the same service interface if deployment adds it.

Alternative considered: add Redis now. Rejected because Redis is not currently present in dependencies or Docker Compose, while the requirement allows in-memory caching with invalidation.

### Prefer indexed Prisma queries and avoid premature database objects

Use existing Prisma indexes on `(tenantId, status, price)`, `(tenantId, status, modelYear)`, `(tenantId, status, mileage)`, `(tenantId, makeId, modelId, variantId)`, and image indexes for listing images. Counter queries should use grouped counts over active listings by condition. Add PostgreSQL functions or materialized views only if tests or profiling show counter/listing aggregation is a bottleneck.

Alternative considered: add a materialized view for counters immediately. Rejected because the active condition/status count is simple, existing indexes are adequate for expected showroom scale, and materialized view refresh/invalidation adds operational complexity.

## Risks / Trade-offs

- Admin listings still require a `sellerUserId` because the schema requires it. -> Use the current admin user as seller for admin-created listings and document this in the API README.
- In-memory cache is per process. -> Keep TTL short and invalidate synchronously after mutations; document Redis as the production replacement path for multi-instance deployments.
- Sequential image uploads are slower for large batches. -> Provide per-file progress and a clear retry path; preserve deterministic order and simpler failure handling.
- Angular 22 RC APIs may shift. -> Use stable Angular forms/signals APIs already used in the repo and keep tests focused on local helpers/components.
- Feature fields requested by the UI may not all exist as first-class columns. -> Persist unsupported detail such as feature checklist and engine text in the existing listing `description` or a structured admin notes section only if necessary; do not change the schema unless a new persisted contract is required.

## Migration Plan

1. Add server DTOs, validation schemas, reusable service/repository methods, cache helpers, and admin routes without changing public behavior.
2. Add Angular core API service and admin vehicle routes/components behind existing authentication.
3. Add landing page counter API consumption with skeleton/loading and fallback states.
4. Add focused unit/API tests, update README files, and verify with `pnpm run prisma:validate`, `pnpm run prisma:generate`, `pnpm run build:prod`, and targeted tests.
5. Rollback by removing the new admin routes/components/cache service and landing counter consumption; no irreversible database migration is planned unless profiling later justifies an optional database object.

## Open Questions

- Should admin-created listings always use the current admin user as `sellerUserId`, or should the UI later support assigning a salesperson?
- Should feature checklists become normalized persisted metadata in a future schema change, or remain part of the listing description for this iteration?

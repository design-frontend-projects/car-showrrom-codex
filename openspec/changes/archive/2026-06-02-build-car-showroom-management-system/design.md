## Context

The application is an Angular 22 SSR app served by Express 5. PostgreSQL access is handled through Prisma 7 under `src/server/**`, while browser code under `src/app/**` consumes same-origin HTTP APIs and must not import Prisma, `pg`, or server modules. Existing auth/RBAC work already provides tenant-aware `User`, `Role`, and permission concepts that this change will extend for showroom ownership and administration.

Current landing/catalog pages are mostly presentation-driven. This change turns the app into a database-backed showroom with public discovery, authenticated listing management, image uploads, listing/request workflows, and bilingual responsive UI.

## Goals / Non-Goals

**Goals:**
- Model makes, models, variants, concrete listings, listing images, price history, model update history, and vehicle requests in PostgreSQL through Prisma.
- Enforce tenant ownership, listing ownership, and a maximum of five active listings per registered client at the database and service layers.
- Provide Express APIs for public search/details, client listing management, image upload, and admin request review.
- Build Angular/PrimeNG public, client, and admin screens with responsive layouts, page transitions, i18n, validation, and real API data.
- Keep file handling, upload validation, and storage path construction server-only.
- Preserve future subscription extensibility without implementing billing or plans now.

**Non-Goals:**
- Paid subscriptions, payment gateways, invoicing, listing boosts, and plan entitlement management.
- Production object storage/CDN integration, though the design keeps storage metadata abstract enough to replace local storage later.
- Real-time WebSocket updates; pages refresh data through HTTP.
- Native mobile apps, auction/bidding, financing, shipment, insurance, or third-party valuation feeds.

## Decisions

1. Use tenant-scoped showroom tables with explicit ownership.

   Prisma will add `CarMake`, `CarModel`, `CarVariant`, `CarListing`, `CarListingImage`, `CarPriceHistory`, `CarModelHistory`, and `VehicleRequest`. Domain rows will include `tenantId` wherever they affect a tenant's catalog or workflow. Listings and requests will reference `sellerUserId`/`clientUserId` through tenant-scoped foreign keys to `User`.

   Alternatives considered:
   - Global make/model tables only: simpler for public catalogs, but weaker for tenant isolation and administrative control.
   - JSON-only vehicle attributes: fast to start, but poor for validated filters, indexes, history, and future subscriptions.

2. Normalize core vehicle attributes but keep listing-specific facts on listings.

   `CarMake` owns brand identity, `CarModel` owns model identity and production/model metadata, and `CarVariant` owns trim/body/fuel/transmission/drive train facts. Listing-specific facts such as VIN, year, mileage, condition, price, location, status, description, and seller ownership stay on `CarListing`. Color can be normalized through `CarColor` or stored as controlled listing fields if the implementation keeps the schema smaller; either path must support filterable exterior/interior colors.

   Alternatives considered:
   - One wide `CarListing` table: rejected because make/model/variant reuse, admin maintenance, and advanced search become brittle.
   - Fully normalized lookup tables for every minor attribute on day one: useful later, but too much schema surface before real catalog data proves the need.

3. Track history with append-only event tables.

   Price changes will write `CarPriceHistory` rows containing old price, new price, currency, changed-by user, reason, and timestamp. Model/variant changes will write `CarModelHistory` rows with old/new make/model/variant references or a structured diff. The service layer will create history inside the same transaction as the listing/model update.

   Alternatives considered:
   - Audit everything through a single generic JSON audit table: flexible, but harder to query for price trends and domain-specific admin screens.
   - Rely only on updated timestamps: insufficient for the explicit history requirement.

4. Enforce the five-active-listing limit in PostgreSQL and repeat it in server validation.

   Active listing statuses will be a small enum set, with `ACTIVE` counting toward the client limit. A raw migration will add a PostgreSQL trigger/function that rejects inserts or status changes when a client already has five active listings in the same tenant. The server service will also pre-check the count and return a translated validation error before the database raises a constraint failure.

   Alternatives considered:
   - Service-only enforcement: vulnerable to races and future code paths that bypass the service.
   - A simple check constraint: PostgreSQL check constraints cannot count sibling rows.

5. Use Express route modules and DTO mappers for showroom APIs.

   Add `src/server/showroom/**` with route registration, validation schemas, repositories, services, DTO mappers, upload handling, and tests. Public routes expose only published/active listings. Client routes require authenticated session identity and ownership. Admin routes require RBAC permissions. Angular services under `src/app/core/showroom/**` call these APIs through the existing HTTP patterns.

   Alternatives considered:
   - Calling Prisma from Angular SSR components: rejected because it breaks the server/browser boundary and risks bundling server dependencies.
   - One large route file: rejected because search, listing management, uploads, and requests have different validation and authorization rules.

6. Store uploads locally behind a server-owned media path.

   The uploader will accept multipart images, validate size, extension, content type, and detected image signature, generate non-guessable storage keys, and write files under an `UPLOAD_ROOT` such as `.data/uploads/listings`. Metadata persists in `CarListingImage` with listing ID, tenant ID, storage key, original name, MIME type, size, width/height when available, sort order, primary flag, and alt text. Express will expose safe read-only media URLs such as `/media/listings/:storageKey`.

   Alternatives considered:
   - Saving files in `public/`: rejected because runtime uploads should not mutate source-controlled/static build assets.
   - Storing image blobs in PostgreSQL: rejected for app simplicity and database bloat.

7. Build public discovery as URL-driven, database-backed search.

   Landing search submits query parameters to catalog routes. Advanced search supports make, model, variant/body/fuel/transmission, year range, price range, mileage range, condition, color, location, and sort. Results and details are fetched from APIs with loading, empty, and error states. Details include full listing facts, history summaries where public, and a PrimeNG carousel/gallery fed by listing images.

   Alternatives considered:
   - Client-side filtering of preloaded listings: rejected because it does not scale or reflect live database state.
   - Search as global app store only: URL state is preferred so searches are shareable and SSR-friendly.

8. Keep client/admin workflows feature-local with shared controls.

   Client pages under `src/app/features/client/**` will cover listing create/edit/manage, image upload/reorder, and request submission/status. Admin pages under `src/app/features/admin/**` will cover request review queues and approve/reject decisions. Shared components cover listing cards, gallery, status badge, image uploader, and validated form controls when reuse is meaningful.

   Alternatives considered:
   - A single management dashboard component: rejected because workflows have distinct permissions, data shapes, and validation needs.

9. Use layered validation and translated error codes.

   Angular forms provide immediate validation and translated feedback. Server schemas remain authoritative for payload shape, cross-field rules, ownership, active listing counts, image limits, and admin decisions. Server responses return stable error codes and optional field errors for `public/i18n/en.json` and `public/i18n/ar.json`.

   Alternatives considered:
   - Trusting client validators: rejected because API callers can bypass the UI.
   - Returning raw database errors: rejected for security and localization.

## Risks / Trade-offs

- Database migration complexity -> Add schema in focused migrations, keep enum values explicit, use indexes for search filters, run Prisma validation/generation, and test trigger behavior against PostgreSQL.
- Active-listing trigger surprises future subscription work -> Keep the trigger function isolated and document the current hardcoded limit so it can later consult a subscription entitlement table.
- Local upload storage is not horizontally scalable -> Store metadata with provider/storage key fields and keep file I/O behind an uploader service so object storage can replace the local provider later.
- Image validation may reject valid edge cases -> Validate common showroom formats first (`jpg`, `jpeg`, `png`, `webp`) and return clear localized errors for unsupported files.
- Search performance can degrade as inventory grows -> Add compound indexes for tenant/status/price/year/mileage/make/model and cap page size; defer full-text search tuning until enough content exists.
- SSR/browser boundary regressions -> Keep all Prisma/upload/file-system code under `src/server/**` and use API DTOs in Angular services.
- Admin workflow can become too broad -> Limit review scope to vehicle requests and listing moderation hooks; keep billing and subscription operations out of this change.

## Migration Plan

1. Add Prisma models, enums, relations, indexes, and raw SQL trigger/function for the active listing cap.
2. Run `npm run prisma:validate`, `npm run prisma:generate`, and create/apply the PostgreSQL migration with `npm run prisma:migrate:dev`.
3. Add `UPLOAD_ROOT`, image limits, and public media URL configuration to `.env.example` and README.
4. Implement server modules under `src/server/showroom/**` and register routes/media serving from `src/server.ts` before the Angular SSR fallback.
5. Add Angular API services, routes, pages, shared components, PrimeNG gallery/search controls, translations, and responsive styles.
6. Add focused unit/integration tests for schema validation, active-listing cap, ownership, request review, image upload association, search filtering, and UI state.
7. Verify `npm run prisma:validate`, `npm run prisma:generate`, `npm run build:prod`, and `npm test -- --watch=false`.

Rollback strategy:
- If server/UI rollout must pause after migration, leave new tables in place and do not register showroom routes in production.
- If upload behavior must roll back, keep image metadata rows but disable write endpoints and continue serving existing media.
- Do not drop history or listing tables until exported or confirmed unused, because they contain user-generated records.

## Open Questions

- Should catalog make/model/variant records be curated only by admins, or can approved client requests create missing makes/models automatically?
- Should active listings include `PENDING_REVIEW`, or only published `ACTIVE` listings count toward the five-listing cap?
- Should listing images require admin review before public display?
- Which initial currencies and markets must be seeded for launch?

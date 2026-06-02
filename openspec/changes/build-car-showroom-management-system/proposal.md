## Why

The app needs a real showroom domain layer so public visitors can discover cars, registered clients can sell vehicles, and administrators can review supply requests using durable PostgreSQL data instead of static page content. Building this now also establishes the inventory, image, validation, and ownership rules needed before subscription plans and paid listing upgrades are added.

## What Changes

- Add PostgreSQL/Prisma models for car makes, models, variants, colors/body/fuel/transmission metadata, concrete listings, listing images, price history, model update history, and request review records.
- Enforce ownership and data integrity for registered clients, including a database-backed limit of five active listings per client while leaving room for future subscription-plan overrides.
- Add server APIs for public catalog search/details, advanced filters, authenticated listing CRUD, listing image upload/ordering, and administrative vehicle-request approve/reject review.
- Add an image uploader service that validates file type/size, stores image metadata, associates each image with exactly one listing, supports primary image selection, and prevents cross-tenant/client access.
- Build Angular/PrimeNG public discovery screens: landing search, advanced search, result cards, details view, responsive image carousel/gallery, empty/loading/error states, and database-backed data binding.
- Build registered-client workflows to create listings, manage own listings, upload/reorder images, submit vehicle requests, and see request/listing status.
- Build administrative review workflows for vehicle requests and listing moderation hooks aligned with existing RBAC concepts.
- Add translated English/Arabic labels and validation messages, responsive layouts, route/page transitions, and accessible form feedback.
- Add focused tests and documentation for schema constraints, server validation, route authorization, image upload behavior, search filtering, and core UI flows.
- Non-goals: payment processing, live subscription billing, third-party valuation feeds, auction/bidding, financing, insurance, shipment logistics, production object-storage/CDN integration, and native mobile apps.

## Capabilities

### New Capabilities
- `vehicle-catalog-inventory`: Covers makes, models, variants, listing records, normalized vehicle attributes, price/model history, active-listing limit, and catalog data integrity.
- `listing-image-management`: Covers secure upload validation, image persistence metadata, listing association, primary image handling, ordering, removal, and public image exposure rules.
- `public-vehicle-discovery`: Covers landing search, advanced filters, result listing, car details view, real database queries, responsive gallery, and public read-only access.
- `client-listing-management`: Covers authenticated client listing creation, editing, status lifecycle, ownership checks, five-active-listing enforcement, and personal listing management UI.
- `vehicle-request-review`: Covers registered-client vehicle requests, administrative approve/reject review, decision audit fields, and request status presentation.

### Modified Capabilities
- `server-database-access`: Add showroom-domain Prisma access, migrations, transactional constraints, upload persistence, and public/authenticated API boundaries.
- `multi-tenant-rbac-persistence`: Add listing ownership, request ownership, administrative review permissions, and tenant-scoped integrity for showroom records.
- `rbac-api-client-state`: Expose client/admin showroom permissions to Angular guards, menus, and API consumers.
- `bilingual-rtl-localization`: Add English and Arabic keys for catalog search, listing forms, image upload states, request review, validation, and status labels.
- `responsive-layout-signals`: Add responsive search/results/detail/listing-management layouts and gallery behavior across mobile, tablet, and desktop breakpoints.
- `uber-inspired-ui-system`: Extend the visual system for showroom discovery, comparison-friendly catalog cards, gallery previews, administrative review screens, transitions, and polished form states.

## Impact

- Affected database files: `prisma/schema.prisma`, new migration files under `prisma/migrations/**`, generated Prisma client output via `npm run prisma:generate`, and possible seed/default-role updates for showroom permissions.
- Affected server files: `src/server.ts`, new `src/server/showroom/**` modules, image upload middleware/storage helpers, server validation schemas, RBAC/request-context integration, and tests using `supertest`/Vitest.
- Affected Angular files: landing/catalog/detail pages under `src/app/features/landing/**`, client management pages under `src/app/features/client/**`, admin review pages under `src/app/features/admin/**`, shared gallery/upload/form components, core HTTP/auth/RBAC services, route configuration, and state stores where appropriate.
- Affected public assets/docs: `public/i18n/en.json`, `public/i18n/ar.json`, `.env.example`, `README.md`, and feature README files for local upload storage and database setup.
- Dependencies may include server upload parsing/storage utilities and a carousel/gallery package only if PrimeNG components already available in the project do not satisfy the gallery requirements.
- Verification must keep `npm run prisma:validate`, `npm run prisma:generate`, `npm run build:prod`, and `npm test -- --watch=false` passing.

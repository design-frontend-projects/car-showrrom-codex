## Why

Administrators need a dedicated, high-confidence workflow for defining showroom inventory instead of relying on client listing screens that are optimized for self-service sellers. This change reduces listing errors, makes publishing state explicit, and gives the public landing page accurate new/used inventory counters after admin-created listings go live.

## What Changes

- Add an admin vehicle definition workflow under `/admin/vehicles`, including create and edit screens for car listings.
- Add signal-driven Angular form state for basic information, pricing, specifications, condition, publish status, features, and live preview.
- Add an admin image upload module with drag-and-drop selection, thumbnail previews, reorder, remove-before-submit, upload progress, and persisted image ordering.
- Add a preview modal before final submission and redirect administrators to the admin home/dashboard after successful save.
- Add admin-oriented API/service methods that reuse the existing Prisma `CarListing`, `CarListingImage`, `CarMake`, `CarModel`, `CarVariant`, and `CarColor` schema relationships.
- Add cached real-time inventory counters for total active new and used cars on the landing page, with invalidation after listing creation, status changes, image changes that affect preview data, and publish/archive operations.
- Add focused unit/API tests for form validation, image queue behavior, Prisma query behavior, and admin listing endpoints.
- Add module READMEs documenting admin vehicle folders, extension points, and API endpoints.
- Non-goals: no changes to billing/subscription entitlements, no public checkout/reservation workflow, no new vehicle taxonomy management UI, and no schema replacement for the existing car listing models.

## Capabilities

### New Capabilities
- `admin-vehicle-definition`: Admin screens and API behavior for creating, editing, previewing, publishing, archiving, and documenting vehicle listings.
- `vehicle-inventory-counters`: Cached public/admin counters for active new and used listings that update after admin listing mutations.

### Modified Capabilities
- `listing-image-management`: Extend image handling requirements to cover admin drag-and-drop upload queues, pre-submit previews, persisted ordering, deletion, and progress feedback.
- `public-vehicle-discovery`: Extend public discovery requirements so landing page category counters reflect current active new and used listing totals.
- `vehicle-catalog-inventory`: Clarify that authorized administrators can create and update listings without the client active-listing limit while still preserving tenant, taxonomy, price history, and model history rules.

## Impact

- Angular feature areas: `src/app/features/admin/**`, new `/admin/vehicles/**` routes, reusable admin vehicle form/uploader/preview components, and landing page counter display.
- Angular core/services: showroom API clients, signal-based form utilities, loading/error handling, and localized UI copy where needed.
- Server/API: `src/server/showroom/routes.ts`, `services.ts`, `repositories.ts`, `validation.ts`, DTOs, upload integration, and focused endpoint tests.
- Database: no new primary vehicle tables; queries must follow `prisma/schema.prisma`. Optional PostgreSQL view/function or in-memory cache may be added only where it measurably simplifies counters or listing previews.
- Runtime/dependencies: continue using pnpm, Angular 22, PrimeNG, Tailwind CSS v4, PrimeIcons/lucide-compatible icon approach already available in the app, Prisma 7, PostgreSQL, and existing Express SSR boundaries.

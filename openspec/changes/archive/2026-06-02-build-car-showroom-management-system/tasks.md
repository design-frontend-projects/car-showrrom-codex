## 1. Database Schema And Migration

- [x] 1.1 Add Prisma enums for listing status, listing condition, fuel type, transmission type, body type, request status, and image provider.
- [x] 1.2 Add tenant-scoped Prisma models for car makes, car models, car variants, optional color metadata, car listings, listing images, price history, model history, and vehicle requests.
- [x] 1.3 Add tenant-aware relations from listings and vehicle requests to the existing `User` and `Tenant` models.
- [x] 1.4 Add uniqueness constraints and indexes for make/model/variant lookup, public search filters, listing ownership, request status queues, image ordering, and history timelines.
- [x] 1.5 Add a PostgreSQL migration trigger/function that enforces the five-active-listing limit per client and tenant.
- [x] 1.6 Add showroom RBAC actions and default role mappings for client listing management, image upload, vehicle request submission, and admin request review.
- [x] 1.7 Run and fix `npm run prisma:validate` after schema changes.
- [x] 1.8 Generate and inspect the Prisma migration with `npm run prisma:migrate:dev`.
- [x] 1.9 Run `npm run prisma:generate` and update server imports to use the regenerated client.

## 2. Server Showroom Foundation

- [x] 2.1 Create `src/server/showroom/**` module structure for routes, services, repositories, validation, DTO mapping, upload handling, and errors.
- [x] 2.2 Add shared showroom error classes that return stable translated error codes and optional field errors.
- [x] 2.3 Add server validation schemas for search filters, listing create/update, status transitions, image metadata, image ordering, and vehicle request review.
- [x] 2.4 Add DTO mappers that expose public-safe listing, image, taxonomy, request, and history shapes without leaking internal fields.
- [x] 2.5 Add authentication and RBAC helper functions for current user, tenant context, listing ownership, and admin permissions.
- [x] 2.6 Register showroom API routes in `src/server.ts` before the Angular SSR fallback.

## 3. Listing And Catalog APIs

- [x] 3.1 Implement public taxonomy endpoints for makes, models, variants, and filter option data.
- [x] 3.2 Implement public listing search with pagination, sorting, text query, and advanced filters backed by database queries.
- [x] 3.3 Implement public listing details that return only active/public listings with ordered images.
- [x] 3.4 Implement authenticated client listing create, update, activate, deactivate, mark-sold, archive, and delete endpoints.
- [x] 3.5 Implement transactional price change handling that writes `CarPriceHistory` whenever listing price changes.
- [x] 3.6 Implement transactional model-change handling that writes `CarModelHistory` whenever make, model, variant, or model-year data changes.
- [x] 3.7 Convert active-listing trigger failures into localized validation error responses.
- [x] 3.8 Add server tests for search filters, public visibility, ownership checks, history writes, and the active-listing limit.

## 4. Image Upload And Media Serving

- [x] 4.1 Add upload configuration for `UPLOAD_ROOT`, max image size, max images per listing, allowed MIME types, and public media URL base.
- [x] 4.2 Add multipart upload dependency and server middleware if the project does not already provide one.
- [x] 4.3 Implement image signature, MIME, extension, and size validation in the uploader service.
- [x] 4.4 Store accepted image files under a non-public upload root using non-guessable storage keys.
- [x] 4.5 Persist listing image metadata with tenant ID, listing ID, storage key, original name, MIME type, size, sort order, primary flag, and alt text.
- [x] 4.6 Implement image upload, delete, reorder, and set-primary endpoints with ownership/admin checks.
- [x] 4.7 Add safe read-only media serving for listing images without exposing raw filesystem paths.
- [x] 4.8 Add server tests for invalid file types, oversized files, cross-owner upload denial, primary image uniqueness, ordering, and media path safety.

## 5. Vehicle Request Workflow APIs

- [x] 5.1 Implement authenticated client vehicle request creation with validation and `PENDING_REVIEW` status.
- [x] 5.2 Implement client request history endpoint scoped to the current user and tenant.
- [x] 5.3 Implement admin request queue endpoint with status filters and pagination.
- [x] 5.4 Implement admin approve/reject endpoints with reviewer, decision note, and reviewed timestamp persistence.
- [x] 5.5 Add server tests for anonymous request rejection, client ownership visibility, admin permission checks, and approve/reject audit fields.

## 6. Angular Data Layer And Routing

- [x] 6.1 Add Angular-safe showroom models and DTO types under `src/app/core/showroom/**`.
- [x] 6.2 Add catalog API service methods for taxonomy, search, and listing details.
- [x] 6.3 Add client listing API service methods for listing CRUD, status transitions, image upload/reorder/delete, and active count.
- [x] 6.4 Add vehicle request API service methods for client submission/history and admin review.
- [x] 6.5 Add or extend signal stores for search state, listing management state, upload progress, and request review state where shared state is needed.
- [x] 6.6 Add lazy routes for catalog results, listing details, client listing management, client request history, and admin request review with existing auth/RBAC guards.
- [x] 6.7 Ensure Angular code does not import Prisma, `pg`, server upload modules, or filesystem utilities.

## 7. Public Discovery UI

- [x] 7.1 Replace landing page static search behavior with URL-driven database-backed search submission.
- [x] 7.2 Build advanced search controls with PrimeNG inputs, selects, sliders, toggles, and clear/reset actions.
- [x] 7.3 Build catalog result cards with image, price, make/model/variant, year, mileage, status, and "More Details" action.
- [x] 7.4 Build loading, empty, error, and paginated result states with translated copy.
- [x] 7.5 Build listing details page with current database data, safe seller context, vehicle facts, price, mileage, description, history summary, and action affordances.
- [x] 7.6 Integrate PrimeNG Carousel or equivalent gallery for ordered listing images with responsive preview controls.
- [x] 7.7 Add route transition metadata and animations for landing, search results, and details navigation.

## 8. Client Listing And Request UI

- [x] 8.1 Build client listing dashboard showing own listings, status, active count out of five, image coverage, last updated time, and available actions.
- [x] 8.2 Build listing create/edit forms with client-side validation for taxonomy, required fields, numeric ranges, and cross-field rules.
- [x] 8.3 Build listing status action controls for activate, deactivate, mark sold, archive, and delete.
- [x] 8.4 Build image upload UI with progress, validation errors, preview thumbnails, reorder, set-primary, and delete behavior.
- [x] 8.5 Build client vehicle request submission form with budget, desired vehicle details, contact preference, and notes.
- [x] 8.6 Build client request history/status view with admin decision notes when available.

## 9. Admin Review UI

- [x] 9.1 Build admin vehicle request queue with status filters, pagination, and scan-friendly request summaries.
- [x] 9.2 Build approve/reject review controls with optional decision note and confirmation feedback.
- [x] 9.3 Hide admin review navigation and controls from users without request-review permission.
- [x] 9.4 Add localized access-denied and stale-request states for admin workflow errors.

## 10. Localization, Responsiveness, And UX Polish

- [x] 10.1 Add English translation keys for showroom search, listings, uploads, requests, statuses, validation, and errors.
- [x] 10.2 Add Arabic translation keys with parity for every showroom key.
- [x] 10.3 Extend translation parity tests to cover showroom keys.
- [x] 10.4 Verify RTL layout for search filters, result cards, details, forms, galleries, upload controls, and admin review screens.
- [x] 10.5 Add responsive CSS for mobile, tablet, and desktop catalog/detail/client/admin layouts using existing responsive layout signals.
- [x] 10.6 Verify text does not overlap or clip inside buttons, cards, forms, tables, galleries, and upload states across supported breakpoints.

## 11. Security, Validation, And Documentation

- [x] 11.1 Apply rate limits, payload limits, CSRF protection where required, and consistent error shaping to showroom mutation routes.
- [x] 11.2 Add README and `.env.example` updates for database migrations, upload storage, image limits, media serving, and verification scripts.
- [x] 11.3 Document the current five-active-listing constraint and how future subscription entitlements can replace the hardcoded limit.
- [x] 11.4 Add client-side tests for showroom services, stores, form validation, route guards, and critical UI states.
- [x] 11.5 Run `npm test -- --watch=false` and address failures.
- [x] 11.6 Run `npm run prisma:validate`, `npm run prisma:generate`, and `npm run build:prod` and address failures.

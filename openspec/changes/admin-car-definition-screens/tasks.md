## 1. Server Contracts

- [x] 1.1 Add admin vehicle DTO types and validation schemas for list, create, update, status, preview, and image metadata payloads.
- [x] 1.2 Add reusable repository helpers for admin listing includes, tenant-scoped listing lookup, grouped inventory counts, and optimized preview/list queries.
- [x] 1.3 Add admin-aware service methods for create, update, status transition, delete/archive, preview fetch, list fetch, and history preservation.
- [x] 1.4 Ensure admin create/activate bypasses the client active-listing limit while client listing behavior remains unchanged.
- [x] 1.5 Add server-only inventory counter cache with tenant-scoped keys, TTL, and invalidation after listing and image mutations that affect public cards or totals.
- [x] 1.6 Register `/api/showroom/admin/vehicles` routes for list, create, read/edit, update, status transition, delete/archive, image upload, reorder, primary, and delete-image operations.
- [x] 1.7 Register a public counter endpoint for active new and used listing totals.

## 2. Frontend API And Models

- [x] 2.1 Extend showroom frontend models with admin vehicle list/detail/input/counter DTOs and image queue types.
- [x] 2.2 Add `AdminVehicleApiService` for admin vehicle CRUD, status changes, uploads with progress, image order, primary image, and image deletion.
- [x] 2.3 Add public inventory counter API consumption for the landing page with loading and failure states.

## 3. Admin Vehicle Screens

- [x] 3.1 Add `/admin/vehicles`, `/admin/vehicles/create`, and `/admin/vehicles/edit/:id` routes under the existing admin route area.
- [x] 3.2 Build the admin vehicle overview screen with inventory summary, filters, loading skeletons, and create/edit actions.
- [x] 3.3 Build a reusable signal-driven vehicle form for basic information, pricing, specifications, condition, status, features, validation, and derived preview values.
- [x] 3.4 Build the admin image upload module with drag-and-drop selection, thumbnails, reorder, delete-before-submit, validation states, and upload progress.
- [x] 3.5 Build the live preview panel that mirrors public listing card data and updates from signals as the form changes.
- [x] 3.6 Add a final preview modal before submit and route-level success/error toast handling.
- [x] 3.7 Implement create submission flow that saves the listing, uploads and links images, persists ordering/primary image, invalidates counters via the server, and redirects after success.
- [x] 3.8 Implement edit submission flow that loads existing details/images, saves changed fields, manages image mutations, and preserves history behavior.

## 4. Landing Counters

- [x] 4.1 Update the landing page UI to display total new cars and total used cars near category actions.
- [x] 4.2 Add polling or explicit refresh behavior so landing counters update after admin-created listings become active.
- [x] 4.3 Ensure counter fallback states do not block search or category navigation.

## 5. Documentation

- [x] 5.1 Add `src/app/features/admin/vehicles/README.md` explaining purpose, folder structure, extension points, and API endpoints.
- [x] 5.2 Add README coverage for reusable admin vehicle form/image/preview submodules if they are placed in nested folders.
- [x] 5.3 Update existing admin/showroom documentation if new API endpoints or cache behavior need discoverability.

## 6. Tests And Verification

- [x] 6.1 Add unit tests for admin vehicle form validation and derived preview state.
- [x] 6.2 Add unit tests for image queue add/remove/reorder/validation/progress behavior.
- [x] 6.3 Add server tests for admin Prisma query/service behavior including taxonomy validation, history writes, admin active-limit bypass, and counter cache invalidation.
- [x] 6.4 Add API endpoint tests for admin vehicle create/update/status/image flows and public counter endpoint.
- [x] 6.5 Run `pnpm run prisma:validate`, `pnpm run prisma:generate`, targeted tests, and `pnpm run build:prod`.
- [x] 6.6 Start the local Angular app and verify the admin create/edit workflow and landing counters in the browser.

# Admin Vehicles

Admin vehicle definition screens for creating, editing, publishing, archiving, and managing images for showroom listings.

## Folder Structure

- `admin-vehicles-page.ts` - inventory overview with counters, filters, and edit/create actions.
- `admin-vehicle-editor-page.ts` - create/edit workflow with validated form sections, image queue, live preview, and submit confirmation.
- `admin-vehicle-form.util.ts` - pure helpers for payload building, preview projection, feature metadata, and image queue operations.

## API Endpoints

- `GET /api/showroom/admin/vehicles` - list admin-manageable vehicle listings.
- `GET /api/showroom/options/:entity` - load focused, tenant-scoped dropdown options for makes, models, trims, conditions, catalog attributes, and colors.
- `POST /api/showroom/admin/vehicles` - create draft or published listings.
- `GET /api/showroom/admin/vehicles/:listingId` - fetch edit/preview data.
- `PATCH /api/showroom/admin/vehicles/:listingId` - update listing details.
- `POST /api/showroom/admin/vehicles/:listingId/status` - publish, archive, sell, or otherwise transition status.
- `DELETE /api/showroom/admin/vehicles/:listingId` - soft-delete a listing.
- `POST /api/showroom/admin/vehicles/:listingId/images` - upload one image and link it to a listing.
- `PATCH /api/showroom/admin/vehicles/:listingId/images/order` - persist gallery order.
- `POST /api/showroom/admin/vehicles/:listingId/images/:imageId/primary` - mark one image as primary.
- `DELETE /api/showroom/admin/vehicles/:listingId/images/:imageId` - delete image metadata and stored media.
- `GET /api/showroom/inventory-counters` - landing page active new/used totals.

## Extension Notes

The overview, create, and edit routes use Angular resolvers for initial listing and option data. Dependent make/model/trim dropdowns use the shared `VehicleOptionLoaderService`; loader configs should include parent keys, query-param mapping, debounce, selected-id fallback, and cache policy.

The workflow persists to the existing `CarListing` and `CarListingImage` schema. Admin-created listings use the current admin user as `sellerUserId` until salesperson assignment is added. Feature checklist, engine, and display-only spec details are folded into `description`; add schema fields before treating those as filterable data.

Image queue helpers are pure and should stay independent from Angular services so validation and reorder logic remain easy to test.

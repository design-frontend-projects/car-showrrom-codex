# admin-vehicle-definition Specification

## Purpose
TBD - created by archiving change admin-car-definition-screens. Update Purpose after archive.
## Requirements
### Requirement: Admin vehicle route structure
The system SHALL provide authenticated admin vehicle management routes for listing overview, creation, and editing.

#### Scenario: Open admin vehicle overview
- **WHEN** an authenticated administrator navigates to `/admin/vehicles`
- **THEN** the system displays an admin vehicle management screen with inventory loading state, listing status context, and actions to create or edit vehicles

#### Scenario: Open admin vehicle creation
- **WHEN** an authenticated administrator navigates to `/admin/vehicles/create`
- **THEN** the system displays a vehicle creation screen using the existing admin application shell and design system

#### Scenario: Open admin vehicle editing
- **WHEN** an authenticated administrator navigates to `/admin/vehicles/edit/:id` for an existing non-deleted listing in the same tenant
- **THEN** the system loads the listing, images, taxonomy data, and editable status fields for that vehicle

### Requirement: Admin vehicle form validation
The system SHALL validate admin vehicle fields on the client and server before creating or updating a listing.

#### Scenario: Required fields missing
- **WHEN** an administrator submits the vehicle form without required make, model, variant, title, year, price, mileage, location, condition, status, or description values
- **THEN** the system blocks submission and displays field-level validation feedback

#### Scenario: Invalid numeric values
- **WHEN** an administrator enters an unsupported model year, negative price, negative mileage, or discount that makes the sale price invalid
- **THEN** the system blocks submission and identifies the invalid fields before sending or accepting the mutation

#### Scenario: Invalid taxonomy relationship
- **WHEN** an administrator submits a make, model, and variant combination that does not belong to the same tenant hierarchy
- **THEN** the server MUST reject the request without creating or updating the listing

### Requirement: Admin vehicle creation
The system SHALL allow authorized administrators to create draft or published vehicle listings from the admin vehicle creation screen.

#### Scenario: Create draft listing
- **WHEN** an authorized administrator submits valid vehicle details with draft status
- **THEN** the server creates a `CarListing` in `DRAFT` status linked to the current tenant, current administrator as seller, and valid make/model/variant records

#### Scenario: Create published listing
- **WHEN** an authorized administrator submits valid vehicle details with published status
- **THEN** the server creates a `CarListing` in `ACTIVE` status, sets `publishedAt`, and makes it eligible for public discovery

#### Scenario: Unauthorized creation rejected
- **WHEN** a user without admin listing permission submits a vehicle creation request
- **THEN** the server MUST reject the request with an authorization error

### Requirement: Admin vehicle editing
The system SHALL allow authorized administrators to edit vehicle details and preserve listing history rules.

#### Scenario: Update vehicle details
- **WHEN** an authorized administrator changes editable vehicle fields for an existing listing
- **THEN** the server persists the changes for the same tenant and returns updated preview data

#### Scenario: Price history recorded
- **WHEN** an authorized administrator changes the listing price
- **THEN** the system records an append-only `CarPriceHistory` entry in the same mutation flow

#### Scenario: Model history recorded
- **WHEN** an authorized administrator changes make, model, variant, or model year
- **THEN** the system records an append-only `CarModelHistory` entry in the same mutation flow

### Requirement: Admin status management
The system SHALL allow authorized administrators to move vehicle listings through draft, pending review, active, inactive, sold, archived, and deleted states where supported by the existing listing status enum.

#### Scenario: Publish listing
- **WHEN** an administrator changes a draft or inactive listing to published
- **THEN** the server stores `ACTIVE` status and updates `publishedAt`

#### Scenario: Archive listing
- **WHEN** an administrator archives a listing
- **THEN** the server stores `ARCHIVED` status, sets `archivedAt`, and removes the listing from public active search results

#### Scenario: Delete listing
- **WHEN** an administrator deletes a listing from the admin workflow
- **THEN** the server stores `DELETED` status and excludes it from admin default lists and public lists

### Requirement: Admin live preview
The system SHALL show a live vehicle listing preview while an administrator edits the form.

#### Scenario: Preview updates from form state
- **WHEN** an administrator changes title, price, mileage, condition, taxonomy, location, status, or selected images
- **THEN** the preview panel updates without requiring a page reload or server round trip

#### Scenario: Final preview modal
- **WHEN** an administrator selects the final submit action for a valid form
- **THEN** the system shows a modal preview of the listing and requires confirmation before persisting changes

### Requirement: Admin submission flow
The system SHALL submit vehicle details, persist images, refresh counters, and complete navigation with user feedback.

#### Scenario: Successful create flow
- **WHEN** an administrator confirms a valid new vehicle with queued images
- **THEN** the system creates the listing, uploads and links images in the selected order, invalidates affected counters, redirects to the admin home or vehicles screen, and shows a success toast

#### Scenario: Partial image upload failure
- **WHEN** vehicle details save successfully but one or more image uploads fail
- **THEN** the system keeps the listing saved, reports failed image uploads, and allows the administrator to retry the failed images

### Requirement: Admin vehicle module documentation
The system SHALL include README documentation for admin vehicle modules.

#### Scenario: Developer opens module README
- **WHEN** a developer opens the admin vehicle module README
- **THEN** it explains the module purpose, folder structure, extension points, and API endpoints used by the workflow

### Requirement: Admin vehicle definition module entry
The system SHALL provide a lazy-loaded admin vehicle definition module reachable only by users with admin or system-owner access.

#### Scenario: Authorized user opens definitions module
- **WHEN** a user with `admin` or `system-owner` role activates the vehicle definitions route
- **THEN** the system displays the admin vehicle definition dashboard with links to each definition screen

#### Scenario: Unauthorized user is blocked
- **WHEN** a user without admin/system-owner access activates the vehicle definitions route
- **THEN** the system prevents access and displays or redirects to a localized access-denied state

### Requirement: Separate vehicle definition CRUD screens
The system SHALL provide separate admin CRUD screens for car make, car model, trim, transmission, engine, fuel type, body type, and condition.

#### Scenario: Definition screen opens
- **WHEN** an authorized admin opens any vehicle definition entity screen
- **THEN** the screen displays a searchable list, loading state, create action, edit action, delete action, and localized empty/error states for that entity

#### Scenario: Definition record is created
- **WHEN** an authorized admin submits a valid create form for a vehicle definition entity
- **THEN** the server creates a tenant-scoped record, the list refreshes or updates optimistically, and the UI announces success

#### Scenario: Definition record is updated
- **WHEN** an authorized admin submits valid edits for an existing vehicle definition entity
- **THEN** the server persists the changes, the list reflects the new values, and the UI announces success

#### Scenario: Definition record is deleted
- **WHEN** an authorized admin confirms deletion of a vehicle definition record that is safe to delete
- **THEN** the server deletes or deactivates the record according to referential integrity rules and the UI announces success

### Requirement: Definition CRUD validation
The system SHALL validate vehicle definition data on the client and server before persistence.

#### Scenario: Required name missing
- **WHEN** an authorized admin submits a definition form without a required display name
- **THEN** the UI blocks submission and displays an inline localized validation message

#### Scenario: Duplicate normalized name rejected
- **WHEN** an admin submits a definition record whose normalized name duplicates another record in the same tenant and parent scope
- **THEN** the server rejects the request with a localized validation error

#### Scenario: Invalid parent relationship rejected
- **WHEN** an admin creates or edits a model without a valid make or a trim without a valid model
- **THEN** the server rejects the request and does not persist an orphaned relationship

### Requirement: Definition screen accessibility
The admin vehicle definition screens SHALL support keyboard operation, focus management, ARIA labels, WCAG AA contrast, and screen-reader announcements for CRUD outcomes.

#### Scenario: Dialog focus is managed
- **WHEN** an admin opens a create, edit, or delete confirmation dialog
- **THEN** focus moves into the dialog and returns to the invoking control after the dialog closes

#### Scenario: Keyboard-only CRUD flow
- **WHEN** an admin uses only a keyboard to search, create, edit, save, cancel, or delete
- **THEN** all controls are reachable and operable in a predictable order

#### Scenario: CRUD outcome is announced
- **WHEN** a create, update, delete, or network failure occurs
- **THEN** the UI provides a screen-reader friendly announcement and visible localized feedback

### Requirement: Users and roles admin utility
The admin module SHALL provide a read-only users-and-roles utility with search and filtering.

#### Scenario: Users and roles utility opens
- **WHEN** an authorized admin opens the users-and-roles utility
- **THEN** the screen displays users, active status, and role membership with search and role filters

#### Scenario: Role editing is unavailable
- **WHEN** an admin views a user row in this change
- **THEN** the UI does not provide role editing controls

### Requirement: Admin vehicle database-backed dropdowns
The admin vehicle create, edit, overview, and filter screens SHALL load dropdown values from database-backed vehicle definition APIs.

#### Scenario: Load admin vehicle create options
- **WHEN** an administrator opens the create vehicle screen
- **THEN** make, condition, exterior color, interior color, engine, transmission, fuel type, and body type options are loaded asynchronously from server DTOs backed by Prisma vehicle definition models

#### Scenario: Replace static enum options
- **WHEN** the admin vehicle editor renders condition, fuel type, transmission, or body type dropdowns
- **THEN** the dropdowns MUST use active catalog records from `VehicleCondition`, `VehicleFuelType`, `VehicleTransmission`, and `VehicleBodyType` instead of hardcoded TypeScript arrays

#### Scenario: Preserve inactive selected edit values
- **WHEN** an administrator edits a listing that references an inactive option
- **THEN** the editor displays the inactive selected option as a non-default fallback while preventing new records from selecting inactive options

### Requirement: Admin vehicle dependent dropdowns
The admin vehicle editor SHALL load dependent dropdown options when parent fields change.

#### Scenario: Brand controls model options
- **WHEN** an administrator changes the selected make
- **THEN** the model list is reloaded for that make, stale model and trim selections are cleared, and no trim request is sent until a model is selected

#### Scenario: Model controls trim options
- **WHEN** an administrator changes the selected model
- **THEN** the trim list is reloaded for that model, stale trim selection is cleared, and trim metadata can populate dependent specification fields

#### Scenario: Debounce repeated parent changes
- **WHEN** an administrator changes a parent field repeatedly within the configured debounce interval
- **THEN** the system sends only the latest dependent option request and ignores stale responses

### Requirement: Declarative option dependency configuration
The admin vehicle and definition workflows SHALL define dropdown dependency behavior through configuration rather than component-specific request logic.

#### Scenario: Configure dependent option source
- **WHEN** a developer defines an option field dependency
- **THEN** the configuration supports parent field keys, service method names, path variables, query parameters, mapping rules, cache policy, debounce interval, search fields, empty state copy, and retry behavior

#### Scenario: Reuse dependency configuration
- **WHEN** both the admin vehicle editor and Define Vehicle Data screens need make, model, or trim options
- **THEN** they can consume the same option loader contract without duplicating HTTP wiring in each component

### Requirement: Admin vehicle server validation feedback
The admin vehicle create and edit flows SHALL surface server-side validation errors as field-level feedback.

#### Scenario: Server rejects invalid taxonomy hierarchy
- **WHEN** an administrator submits make, model, and trim values that do not belong to the same tenant hierarchy
- **THEN** the server rejects the mutation and the UI displays field-level feedback without losing entered form values

#### Scenario: Server rejects inactive option selection
- **WHEN** an administrator submits a new listing with an inactive condition, color, or catalog option
- **THEN** the server rejects the mutation and identifies the invalid field

#### Scenario: Retry failed save
- **WHEN** an admin vehicle save fails because of a transient server or network error
- **THEN** the UI keeps the form state and allows the administrator to retry the save

### Requirement: Admin definition server-side list processing
The Define Vehicle Data screens SHALL use server-side filtering, sorting, searching, and pagination.

#### Scenario: Filter definition rows
- **WHEN** an administrator filters definition records by keyword, active state, parent make, parent model, sort order, page, or page size
- **THEN** the UI sends those parameters to the server and renders the returned result envelope

#### Scenario: Avoid client-side full-table filtering
- **WHEN** a definition screen loads records for a vehicle definition entity
- **THEN** the UI MUST NOT require loading every row for that entity before filtering, sorting, or paginating the visible table

### Requirement: Admin vehicle color selection
The system SHALL let administrators select vehicle exterior and interior colors from active tenant color definition catalogs on the admin vehicle creation and editing screens.

#### Scenario: Open create vehicle color selectors
- **WHEN** an authorized administrator opens `/admin/vehicles/create`
- **THEN** the exterior color and interior color fields render as searchable dropdowns populated from active tenant exterior and interior color definitions

#### Scenario: Color options show swatches
- **WHEN** an administrator opens an exterior or interior color dropdown
- **THEN** each color option displays its swatch when a hex value exists, localized label when available, canonical name fallback, and active-state-safe metadata without overlapping text

#### Scenario: Vehicle preview reflects selected colors
- **WHEN** an administrator changes exterior or interior color selections in the vehicle editor
- **THEN** the live preview and confirmation modal update without a page reload and include the selected color labels where the preview layout supports color metadata

#### Scenario: Existing inactive color remains understandable
- **WHEN** an administrator edits a listing that references a color definition that has since been deactivated
- **THEN** the editor displays the existing selected color as a legacy or inactive value while preventing it from being chosen for unrelated new selections

### Requirement: Admin vehicle color validation
The system SHALL validate selected exterior and interior color references on the client and server before creating or updating a listing.

#### Scenario: Invalid exterior color rejected
- **WHEN** an administrator submits a vehicle with an exterior color ID that does not belong to the current tenant exterior color catalog
- **THEN** the server MUST reject the request without creating or updating the listing

#### Scenario: Invalid interior color rejected
- **WHEN** an administrator submits a vehicle with an interior color ID that does not belong to the current tenant interior color catalog
- **THEN** the server MUST reject the request without creating or updating the listing

#### Scenario: Color fields remain optional
- **WHEN** an administrator submits a valid vehicle without exterior or interior color selections
- **THEN** the server persists the listing with null color IDs and no color display-name fallback for the missing selections


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


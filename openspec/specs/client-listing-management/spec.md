# client-listing-management Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
### Requirement: Client Add Vehicle database-backed dropdowns
The client Add Vehicle form SHALL load dropdown values asynchronously from database-backed vehicle definition APIs.

#### Scenario: Load client listing options
- **WHEN** a registered client opens the listing creation form
- **THEN** make, condition, color, and other available vehicle definition dropdowns are loaded from server DTOs backed by Prisma models rather than static browser lists

#### Scenario: Search client listing options
- **WHEN** a registered client searches a dropdown value
- **THEN** the dropdown filters against database-backed options and displays a localized empty state when no values match

### Requirement: Client Add Vehicle dependent dropdowns
The client Add Vehicle form SHALL load model and trim options dynamically based on parent selections.

#### Scenario: Client selects make
- **WHEN** a registered client selects a make
- **THEN** the form fetches models for that make, clears any stale model and trim selections, and keeps unrelated entered fields unchanged

#### Scenario: Client selects model
- **WHEN** a registered client selects a model
- **THEN** the form fetches trims for that model, clears any stale trim selection, and avoids requesting trims for unrelated models

### Requirement: Client Add Vehicle server validation feedback
The client listing creation workflow SHALL project server validation responses into the form.

#### Scenario: Client submits invalid listing
- **WHEN** a registered client submits missing fields, invalid numeric ranges, inactive options, or an invalid taxonomy hierarchy
- **THEN** the server rejects the mutation and the UI displays field-level feedback based on the server response

#### Scenario: Client retries listing creation
- **WHEN** a listing creation request fails because of a transient server or network error
- **THEN** the UI keeps the draft values and allows the client to retry without reselecting dropdown values

### Requirement: Authenticated client listing creation
Registered clients SHALL be able to create car listings through a validated Angular form backed by server-side validation.

#### Scenario: Create listing as client
- **WHEN** a logged-in client submits valid listing details and is below the active-listing limit
- **THEN** the system creates the listing for that client and shows it in the client's listing management view

#### Scenario: Anonymous listing creation blocked
- **WHEN** an anonymous user attempts to access listing creation or submit listing data
- **THEN** the system MUST require authentication before accepting the listing

### Requirement: Client-owned listing management
Registered clients SHALL be able to view, edit, activate, deactivate, mark sold, archive, and delete only their own listings.

#### Scenario: Edit own listing
- **WHEN** a logged-in client edits a listing they own
- **THEN** the system applies valid changes and preserves ownership, tenant, and history rules

#### Scenario: Edit another client's listing blocked
- **WHEN** a client attempts to manage a listing owned by another client
- **THEN** the system MUST reject the request with an authorization error

### Requirement: Listing form validation
The listing management UI and server APIs SHALL validate required fields, numeric ranges, enum values, ownership references, and cross-field rules.

#### Scenario: Invalid listing form
- **WHEN** a client submits missing required fields or invalid price, mileage, year, or taxonomy values
- **THEN** the UI displays localized field errors based on server and client validation feedback

### Requirement: Client listing dashboard
The client area SHALL show the user's listings with status, active count, image coverage, recent update time, and available actions.

#### Scenario: Active count displayed
- **WHEN** a logged-in client opens their listing dashboard
- **THEN** the UI displays the number of active listings used out of the current limit of five

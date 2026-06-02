# client-listing-management Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
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


# public-vehicle-discovery Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
### Requirement: Landing page search
The landing page SHALL provide a search interface that queries persisted car listings through server APIs.

#### Scenario: Search from landing page
- **WHEN** a public user enters a search term and submits the landing search
- **THEN** the app navigates to a catalog results view with URL query parameters and displays matching active listings from the database

### Requirement: Advanced catalog filters
The system SHALL provide advanced filters for make, model, variant or body type, fuel type, transmission, year range, price range, mileage range, condition, color, location, and sort order.

#### Scenario: Apply advanced filters
- **WHEN** a public user applies advanced filters
- **THEN** the server returns only active listings matching those filters and the UI reflects the selected filter state

#### Scenario: Empty catalog results
- **WHEN** a search returns no active listings
- **THEN** the UI displays a localized empty state without showing stale results

### Requirement: Car details view
The system SHALL provide a car details route accessible from each search result's "More Details" action.

#### Scenario: Open listing details
- **WHEN** a public user selects "More Details" for an active listing
- **THEN** the app displays current database-backed listing details, seller-safe contact context, vehicle attributes, price, mileage, status, and images

#### Scenario: Inactive listing details hidden
- **WHEN** a public user requests a listing that is not active or not public
- **THEN** the system MUST return a not-found or unavailable response rather than exposing private listing data

### Requirement: Public image gallery
The car details view SHALL display listing images in a responsive PrimeNG carousel or equivalent gallery component.

#### Scenario: Gallery renders ordered images
- **WHEN** an active listing has multiple images
- **THEN** the details page displays the images in persisted order with responsive preview controls

### Requirement: Landing inventory counters
The public landing page SHALL show current active new and used vehicle totals from the showroom listing database.

#### Scenario: Display active inventory totals
- **WHEN** a public user opens the landing page
- **THEN** the page displays total new cars and total used cars based on active persisted listings for the current tenant

#### Scenario: Totals align with public listing visibility
- **WHEN** a listing is not visible in public active search
- **THEN** the landing page counters MUST exclude it from new and used totals

#### Scenario: Admin publish reflected publicly
- **WHEN** an administrator publishes a new or used listing
- **THEN** the public landing counters reflect the changed totals after the configured refresh or cache invalidation path


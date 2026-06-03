# public-vehicle-discovery Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
### Requirement: Condition-scoped public inventory routes
The public catalog SHALL request listing datasets according to the active route's inventory scope.

#### Scenario: Used Cars requests used inventory
- **WHEN** a public user opens `/used-cars`
- **THEN** the UI sends a used inventory scope or equivalent condition filters to the server and receives only active used, certified pre-owned, or damaged listings according to the configured used scope

#### Scenario: New Cars requests new inventory
- **WHEN** a public user opens `/new-cars`
- **THEN** the UI sends a new inventory scope or equivalent condition filter to the server and receives only active new listings

#### Scenario: Filter changes preserve route scope
- **WHEN** a public user applies keyword, taxonomy, range, location, or sort filters on `/used-cars` or `/new-cars`
- **THEN** the server applies those filters within the route's inventory scope and returns scoped pagination totals

### Requirement: Database-backed public filter options
The public catalog SHALL load filter dropdown options asynchronously from server DTOs backed by Prisma vehicle definition models.

#### Scenario: Load public filter options
- **WHEN** the public catalog renders make, model, trim, condition, body type, fuel type, transmission, or color filters
- **THEN** each dropdown uses database-backed options from the active tenant rather than hardcoded browser lists

#### Scenario: Search public filter options
- **WHEN** a public user types into a searchable filter dropdown
- **THEN** the UI requests matching options from the server or filters a fresh cached server result and displays an empty state when no options match

### Requirement: Public catalog server-side filtering
The public catalog SHALL rely on server-side filtering, sorting, searching, and pagination for listing results.

#### Scenario: Send filter parameters only
- **WHEN** a public user changes catalog filters, sort order, or page
- **THEN** the UI sends query parameters and the server returns processed `items`, `page`, `pageSize`, `total`, and `pageCount`

#### Scenario: Apply range filters
- **WHEN** a public user applies year, price, or mileage ranges
- **THEN** the server applies the range filters through Prisma and returns only matching active listings within the current route scope

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

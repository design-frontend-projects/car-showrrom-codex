## ADDED Requirements

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

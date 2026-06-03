## ADDED Requirements

### Requirement: Condition-scoped catalog route resolution
The system SHALL resolve listing results for Used Cars and New Cars before activating their catalog routes, using a route-specific condition scope.

#### Scenario: Resolve used cars route
- **WHEN** a user navigates to `/used-cars`
- **THEN** the resolver loads only active listings matching the used inventory condition scope and provides that result to the catalog page before the page renders results

#### Scenario: Resolve new cars route
- **WHEN** a user navigates to `/new-cars`
- **THEN** the resolver loads only active listings matching the new inventory condition scope and provides that result to the catalog page before the page renders results

#### Scenario: Avoid cross-route dataset loading
- **WHEN** a user navigates from `/used-cars` to `/new-cars`
- **THEN** the system MUST NOT request the used inventory dataset as part of the new inventory route activation

### Requirement: Resolver loading and error states
The system SHALL expose consistent loading, resolved, empty, and failed states for route-resolved vehicle pages.

#### Scenario: Resolver succeeds with empty data
- **WHEN** a vehicle route resolver returns an empty result set
- **THEN** the page displays the route-appropriate empty state without stale results from a previous route

#### Scenario: Resolver fails
- **WHEN** a vehicle route resolver fails because the API returns a validation, tenant, authorization, or server error
- **THEN** the route displays a recoverable error state with a retry path and MUST NOT render stale vehicle data

### Requirement: Resolver prefetch and cache strategy
The system SHALL support tenant-aware prefetching and bounded caching for route-resolved vehicle list and option data.

#### Scenario: Prefetch linked vehicle route
- **WHEN** the application prefetches a known Used Cars or New Cars route
- **THEN** it requests only the route's scoped listing query and stores it under a cache key that includes tenant, route scope, filters, sort, page, and page size

#### Scenario: Reuse fresh cached route data
- **WHEN** a user revisits the same vehicle route with the same tenant and query parameters before cache expiry
- **THEN** the resolver may reuse fresh cached data without issuing a duplicate API request

#### Scenario: Invalidate stale vehicle route cache
- **WHEN** a listing mutation changes active visibility, condition, price, mileage, year, taxonomy, or status
- **THEN** affected route cache entries are invalidated before later route resolution uses them

### Requirement: Admin vehicle route resolution
The system SHALL resolve admin vehicle workflow data before showing admin overview, create, and edit screens.

#### Scenario: Resolve admin vehicle overview
- **WHEN** an authorized administrator navigates to `/admin/vehicles`
- **THEN** the resolver loads the requested page of admin listings, counters, and filter option metadata without loading edit-only listing detail

#### Scenario: Resolve admin vehicle edit
- **WHEN** an authorized administrator navigates to `/admin/vehicles/edit/:id`
- **THEN** the resolver loads the editable listing detail plus only the option sets required to populate the current form state

#### Scenario: Resolve admin vehicle create
- **WHEN** an authorized administrator navigates to `/admin/vehicles/create`
- **THEN** the resolver loads initial option sets needed for a blank form and MUST NOT request a listing detail endpoint

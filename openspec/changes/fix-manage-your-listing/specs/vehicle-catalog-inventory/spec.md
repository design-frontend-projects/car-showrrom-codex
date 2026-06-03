## MODIFIED Requirements

### Requirement: Listing persistence
The system SHALL persist specific car listings with tenant, seller, make, model, variant, price, currency, year, mileage, condition, condition catalog relationship, location, status, and descriptive fields required for catalog search and detail views.

#### Scenario: Create complete listing
- **WHEN** a registered client submits a valid listing payload
- **THEN** the system creates a listing owned by that client and associated with valid vehicle taxonomy records

#### Scenario: Reject invalid listing reference
- **WHEN** a listing references a make, model, or variant outside the listing tenant or hierarchy
- **THEN** the system MUST reject the listing before it becomes visible in public search

#### Scenario: Persist listing condition catalog relationship
- **WHEN** a client or administrator creates or updates a listing with a valid condition code
- **THEN** the server MUST persist both the enum `condition` value and the tenant-scoped `conditionId` for the matching active `VehicleCondition` catalog row

#### Scenario: Reject invalid listing condition catalog value
- **WHEN** a listing mutation submits a condition code without a matching active tenant-scoped `VehicleCondition` catalog row
- **THEN** the server MUST reject the mutation with a field-level validation error for `condition`

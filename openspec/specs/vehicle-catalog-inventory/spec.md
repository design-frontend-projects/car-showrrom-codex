# vehicle-catalog-inventory Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
### Requirement: Tenant-scoped vehicle taxonomy
The system SHALL persist car makes, models, and variants as relational PostgreSQL records with tenant-scoped uniqueness, stable identifiers, timestamps, and searchable normalized fields.

#### Scenario: Create taxonomy records
- **WHEN** an authorized administrator creates a make, model, and variant for a tenant
- **THEN** the system stores the records with valid tenant relationships and prevents duplicate names within the same parent scope

#### Scenario: Reject orphan taxonomy
- **WHEN** a model references a missing make or a variant references a missing model
- **THEN** the database MUST reject the write through foreign key constraints

### Requirement: Listing persistence
The system SHALL persist specific car listings with tenant, seller, make, model, variant, price, currency, year, mileage, condition, location, status, and descriptive fields required for catalog search and detail views.

#### Scenario: Create complete listing
- **WHEN** a registered client submits a valid listing payload
- **THEN** the system creates a listing owned by that client and associated with valid vehicle taxonomy records

#### Scenario: Reject invalid listing reference
- **WHEN** a listing references a make, model, or variant outside the listing tenant or hierarchy
- **THEN** the system MUST reject the listing before it becomes visible in public search

### Requirement: Price history tracking
The system SHALL create append-only price history records whenever a listing price changes after initial creation.

#### Scenario: Update listing price
- **WHEN** a listing owner or authorized administrator changes a listing price
- **THEN** the system records the previous price, new price, currency, changed-by user when available, reason when provided, and timestamp in the same transaction

### Requirement: Model update history tracking
The system SHALL create append-only model history records whenever a listing's make, model, variant, or model-year metadata changes after initial creation.

#### Scenario: Update listing model data
- **WHEN** an authorized actor changes model-related fields on an existing listing
- **THEN** the system records the old values, new values, changed-by user when available, reason when provided, and timestamp in the same transaction

### Requirement: Active listing limit
The system SHALL limit each registered client to five active listings per tenant until subscription plan entitlements are implemented.

#### Scenario: Sixth active listing is blocked
- **WHEN** a registered client with five active listings attempts to create or activate another listing in the same tenant
- **THEN** the system MUST reject the operation and return a client-readable validation error

#### Scenario: Inactive listing does not count
- **WHEN** a registered client has inactive, draft, rejected, sold, archived, or deleted listings
- **THEN** those listings MUST NOT count toward the five active listing limit


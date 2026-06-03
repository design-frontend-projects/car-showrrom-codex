## MODIFIED Requirements

### Requirement: Active listing limit
The system SHALL limit each registered client to five active listings per tenant until subscription plan entitlements are implemented, while authorized administrators SHALL be able to create or activate admin-managed listings without consuming that client self-service limit.

#### Scenario: Sixth active listing is blocked
- **WHEN** a registered client with five active listings attempts to create or activate another listing in the same tenant through the client workflow
- **THEN** the system MUST reject the operation and return a client-readable validation error

#### Scenario: Inactive listing does not count
- **WHEN** a registered client has inactive, draft, rejected, sold, archived, or deleted listings
- **THEN** those listings MUST NOT count toward the five active listing limit

#### Scenario: Admin published listing bypasses client limit
- **WHEN** an authorized administrator creates or activates a listing through the admin vehicle workflow
- **THEN** the system MUST NOT reject the operation because of the client active-listing limit

## ADDED Requirements

### Requirement: Admin listing persistence
The system SHALL persist administrator-created vehicle definitions as tenant-scoped `CarListing` records using the existing Prisma model relations.

#### Scenario: Persist admin-created listing relationships
- **WHEN** an administrator creates a valid vehicle definition
- **THEN** the system stores one `CarListing` linked to the tenant, current administrator seller, make, model, variant, optional colors, status, condition, price, mileage, model year, location, and description

#### Scenario: Admin listing uses schema enums
- **WHEN** an administrator selects condition, fuel type, transmission, body type, or listing status values
- **THEN** the server accepts only values represented by the Prisma enums in `prisma/schema.prisma`

### Requirement: Optimized admin listing preview queries
The system SHALL fetch admin listing preview data with bounded includes and stable ordering.

#### Scenario: Fetch admin preview
- **WHEN** an administrator opens an existing vehicle definition for edit or preview
- **THEN** the server returns listing details, make/model/variant, seller-safe context, and images ordered by `sortOrder` without exposing unrelated tenant data

#### Scenario: Count admin inventory
- **WHEN** the admin vehicle overview loads summary totals
- **THEN** the server counts listings by relevant status and condition using tenant-scoped Prisma filters

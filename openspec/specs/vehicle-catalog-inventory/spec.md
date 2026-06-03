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

### Requirement: Canonical database-backed vehicle dropdowns
The system SHALL populate define-vehicle dropdowns from canonical database-backed vehicle definition sources rather than hard-coded browser lists.

#### Scenario: Make dropdown loads from database
- **WHEN** the define-vehicle form loads make options
- **THEN** the options come from active tenant-scoped car make records returned by the server

#### Scenario: Attribute dropdown loads from database
- **WHEN** the define-vehicle form loads transmission, engine, fuel type, body type, or condition options
- **THEN** the options come from canonical database-backed catalog records returned by the server

#### Scenario: Missing canonical table blocks compatibility
- **WHEN** a dropdown entity is not backed by a canonical database table or accepted compatibility source
- **THEN** the schema compatibility check fails and the implementation MUST NOT replace it with a hard-coded Angular list

### Requirement: Dependent make model trim loading
The define-vehicle form SHALL load dependent dropdown options based on the selected parent entity.

#### Scenario: Selecting make filters models
- **WHEN** an admin selects a car make
- **THEN** the model dropdown loads only active models belonging to that make and tenant

#### Scenario: Selecting model filters trims
- **WHEN** an admin selects a car model
- **THEN** the trim dropdown loads only active trims or variants belonging to that model and tenant

#### Scenario: Parent change clears child selections
- **WHEN** an admin changes the selected make or model
- **THEN** incompatible child model or trim selections are cleared and validation updates immediately

### Requirement: Dropdown search and metadata
Vehicle definition dropdowns SHALL support typeahead search, keyboard navigation, loading states, missing-data fallbacks, and helpful metadata where available.

#### Scenario: Typeahead filters options
- **WHEN** an admin types in a vehicle definition dropdown
- **THEN** matching options are filtered without losing keyboard navigation support

#### Scenario: Model metadata is displayed
- **WHEN** model options include production year range metadata
- **THEN** the dropdown displays the metadata with the model label

#### Scenario: Missing dependent data fallback
- **WHEN** a selected make has no active models or a selected model has no active trims
- **THEN** the dropdown displays a localized empty state and a clear path to create the missing definition

### Requirement: Vehicle catalog cache invalidation
The system SHALL cache static vehicle definition lists with tenant-aware keys and invalidate affected cache entries after create, update, delete, or deactivate operations.

#### Scenario: Static list is cached
- **WHEN** a vehicle definition list such as makes, transmissions, fuel types, body types, or conditions is requested repeatedly within the TTL
- **THEN** the system may reuse cached data for the same tenant and locale

#### Scenario: Mutation invalidates cache
- **WHEN** an admin creates, updates, deletes, or deactivates a vehicle definition record
- **THEN** affected list and dependent dropdown cache entries are invalidated before the next response

### Requirement: Vehicle definition referential integrity
The system SHALL prevent destructive changes to vehicle definition records that are referenced by active listings or child catalog records unless the operation is a supported deactivation.

#### Scenario: Referenced make deletion is blocked
- **WHEN** an admin attempts to delete a make referenced by models or listings
- **THEN** the server blocks hard deletion and returns a localized referential integrity error or performs a documented deactivation flow

#### Scenario: Referenced attribute deletion is blocked
- **WHEN** an admin attempts to delete an engine, transmission, fuel type, body type, or condition referenced by trims or listings
- **THEN** the server blocks hard deletion and returns a localized referential integrity error or performs a documented deactivation flow

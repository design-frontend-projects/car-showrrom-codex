## ADDED Requirements

### Requirement: Canonical vehicle option sources
The system SHALL source vehicle dropdown and multi-select values from Prisma-backed vehicle definition models and listing relationships.

#### Scenario: Read canonical option models
- **WHEN** a vehicle form, filter, or definition workflow requests makes, models, trims, engines, transmissions, fuel types, body types, conditions, exterior colors, or interior colors
- **THEN** the server reads from the corresponding tenant-scoped Prisma models and returns Angular-safe DTOs

#### Scenario: Reject missing canonical option
- **WHEN** a vehicle mutation references an option that does not exist for the active tenant
- **THEN** the server MUST reject the mutation before creating or updating the listing

### Requirement: Tenant-aware dependent option endpoints
The system SHALL expose tenant-scoped option queries for parent-child vehicle definition relationships.

#### Scenario: Fetch models for make
- **WHEN** a client requests models with a make identifier
- **THEN** the server returns only active models for that make and tenant

#### Scenario: Fetch trims for model
- **WHEN** a client requests trims with a model identifier
- **THEN** the server returns only active trims for that model and tenant

#### Scenario: Include selected inactive option for editing
- **WHEN** an edit form requests options with a selected inactive identifier
- **THEN** the server may include that selected record with inactive metadata so the UI can display existing persisted data safely

### Requirement: Vehicle catalog cache invalidation
The system SHALL cache option results only with tenant-aware keys and invalidate affected keys after mutations.

#### Scenario: Cache option list
- **WHEN** an option list is loaded for a tenant, entity, query, dependency, and active-state policy
- **THEN** the cache key includes those values so unrelated tenants or dependencies do not share results

#### Scenario: Invalidate definition cache
- **WHEN** an administrator creates, updates, or deactivates a vehicle definition record
- **THEN** cache entries for the affected tenant and definition entity are invalidated before later option requests reuse cached data

### Requirement: Consistent new and used inventory grouping
The system SHALL apply one server-side definition of new and used vehicle grouping across routes, counters, search results, and admin workflows.

#### Scenario: Count and route grouping align
- **WHEN** a listing's condition or active status changes
- **THEN** public Used Cars results, New Cars results, and inventory counters reflect the same new/used grouping after cache invalidation or expiry

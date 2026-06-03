## ADDED Requirements

### Requirement: Side-specific listing color relationships
The system SHALL persist listing exterior and interior colors through side-specific tenant-scoped catalog relationships.

#### Scenario: Persist listing color relationships
- **WHEN** a listing is created or updated with valid exterior and interior color IDs
- **THEN** the database stores `exteriorColorId` against the exterior color catalog and `interiorColorId` against the interior color catalog for the same tenant

#### Scenario: Reject cross-tenant color reference
- **WHEN** a listing mutation references an exterior or interior color from another tenant
- **THEN** the system MUST reject the mutation before the listing is created or updated

#### Scenario: Preserve color display names
- **WHEN** a listing is saved with selected color definitions
- **THEN** the system stores display-name fallbacks for exterior and interior colors so listing cards and details remain readable after catalog edits

### Requirement: Optimized color catalog queries
The system SHALL fetch color catalogs with tenant-scoped filters and indexes suitable for admin definition screens and vehicle editor dropdowns.

#### Scenario: Query active color catalogs
- **WHEN** the vehicle editor requests active color options
- **THEN** the server queries exterior and interior color tables by tenant, active state, sort order, and name using indexed access patterns

#### Scenario: Invalidate color catalog cache
- **WHEN** an admin creates, updates, or deactivates an exterior or interior color definition
- **THEN** the system invalidates affected tenant taxonomy and definition caches before subsequent list or dropdown requests

### Requirement: Legacy color data migration
The system SHALL migrate existing generic color references to side-specific exterior and interior color catalog records without losing listing readability.

#### Scenario: Backfill exterior color references
- **WHEN** an existing listing has a generic exterior color reference before migration
- **THEN** migration creates or maps a matching exterior color definition and keeps the listing exterior color label available

#### Scenario: Backfill interior color references
- **WHEN** an existing listing has a generic interior color reference before migration
- **THEN** migration creates or maps a matching interior color definition and keeps the listing interior color label available

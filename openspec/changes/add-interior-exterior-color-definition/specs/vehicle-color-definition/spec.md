## ADDED Requirements

### Requirement: Side-specific color persistence
The system SHALL persist exterior and interior color definitions as separate tenant-scoped relational catalog records with stable identifiers, normalized names, optional swatch hex values, localized names, active state, sort order, timestamps, uniqueness constraints, and query indexes.

#### Scenario: Create exterior color definition
- **WHEN** an authorized admin creates an exterior color named "Pearl White" for a tenant
- **THEN** the system stores it in the exterior color catalog with the current tenant, normalized name, active state, sort order, timestamps, and optional hex swatch metadata

#### Scenario: Create interior color definition
- **WHEN** an authorized admin creates an interior color named "Cognac Leather" for a tenant
- **THEN** the system stores it in the interior color catalog independently from exterior colors with the current tenant, normalized name, active state, sort order, timestamps, and optional hex swatch metadata

#### Scenario: Duplicate color rejected within same side
- **WHEN** an admin creates two active or inactive exterior color definitions with the same normalized name in the same tenant
- **THEN** the system MUST reject the duplicate exterior color while still allowing the same normalized name in the interior color catalog

### Requirement: Color definition administration API
The system SHALL provide admin/system-owner-only list, create, update, and deactivate API operations for exterior and interior color definitions.

#### Scenario: List color definitions
- **WHEN** an authorized admin lists exterior or interior color definitions with search text and inactive filtering
- **THEN** the API returns only matching records from the current tenant ordered by active state, sort order, and name

#### Scenario: Unauthorized color mutation rejected
- **WHEN** a user without showroom admin access attempts to create, update, or deactivate a color definition
- **THEN** the server MUST reject the request before writing data or audit events

#### Scenario: Color mutation audited
- **WHEN** an authorized admin creates, updates, or deactivates a color definition
- **THEN** the system records an audit event with tenant, actor, target type, target ID, action, and sanitized metadata

### Requirement: Color definition validation
The system SHALL validate color definition payloads before persistence.

#### Scenario: Missing color name
- **WHEN** an admin submits a color definition without a non-empty name
- **THEN** the system rejects the request with localized field-level validation feedback

#### Scenario: Invalid swatch value
- **WHEN** an admin submits a color definition with a malformed hex color value
- **THEN** the system rejects the request with localized field-level validation feedback

#### Scenario: Localized labels accepted
- **WHEN** an admin submits localized color names keyed by supported language codes
- **THEN** the system stores those names and returns them in color definition DTOs

### Requirement: Admin color definition screens
The system SHALL expose exterior and interior color definition screens from the admin definitions area for admin/system-owner users.

#### Scenario: Open exterior colors screen
- **WHEN** an authorized admin opens `/admin/definitions/exterior-colors`
- **THEN** the system displays a searchable exterior colors management screen with swatches, active state, create, edit, and deactivate actions

#### Scenario: Open interior colors screen
- **WHEN** an authorized admin opens `/admin/definitions/interior-colors`
- **THEN** the system displays a searchable interior colors management screen with swatches, active state, create, edit, and deactivate actions

#### Scenario: Color form renders expected fields
- **WHEN** an admin creates or edits a color definition
- **THEN** the form includes name, swatch hex value, localized names, sort order, and active state controls with translated labels

### Requirement: Color taxonomy response
The system SHALL expose active exterior and interior color catalogs separately in showroom taxonomy responses.

#### Scenario: Load taxonomy for vehicle editor
- **WHEN** the admin vehicle editor loads taxonomy for the current tenant
- **THEN** the response includes `exteriorColors` and `interiorColors` arrays containing active color definitions ordered by sort order and name

#### Scenario: Inactive colors hidden from create dropdowns
- **WHEN** a color definition is inactive
- **THEN** it does not appear in create vehicle color dropdown options unless the current edited listing already references it

### Requirement: Vehicle color dropdown usage
The system SHALL use active admin-defined exterior and interior colors as dropdown options in the admin create/edit vehicle screen.

#### Scenario: Create vehicle with catalog colors
- **WHEN** an admin selects exterior and interior color dropdown values and saves a valid vehicle
- **THEN** the listing stores the selected exterior color ID, interior color ID, and stable display names derived from the selected catalog labels

#### Scenario: Clear optional color selection
- **WHEN** an admin clears an optional exterior or interior color selection before saving
- **THEN** the listing stores a null color ID and null display-name fallback for that side

#### Scenario: Cross-side color rejected
- **WHEN** an admin submits an interior color ID as an exterior color or an exterior color ID as an interior color
- **THEN** the server MUST reject the listing mutation with localized validation feedback

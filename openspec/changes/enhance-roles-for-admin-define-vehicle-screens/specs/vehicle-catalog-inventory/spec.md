## ADDED Requirements

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

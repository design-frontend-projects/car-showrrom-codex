## ADDED Requirements

### Requirement: Admin vehicle database-backed dropdowns
The admin vehicle create, edit, overview, and filter screens SHALL load dropdown values from database-backed vehicle definition APIs.

#### Scenario: Load admin vehicle create options
- **WHEN** an administrator opens the create vehicle screen
- **THEN** make, condition, exterior color, interior color, engine, transmission, fuel type, and body type options are loaded asynchronously from server DTOs backed by Prisma vehicle definition models

#### Scenario: Replace static enum options
- **WHEN** the admin vehicle editor renders condition, fuel type, transmission, or body type dropdowns
- **THEN** the dropdowns MUST use active catalog records from `VehicleCondition`, `VehicleFuelType`, `VehicleTransmission`, and `VehicleBodyType` instead of hardcoded TypeScript arrays

#### Scenario: Preserve inactive selected edit values
- **WHEN** an administrator edits a listing that references an inactive option
- **THEN** the editor displays the inactive selected option as a non-default fallback while preventing new records from selecting inactive options

### Requirement: Admin vehicle dependent dropdowns
The admin vehicle editor SHALL load dependent dropdown options when parent fields change.

#### Scenario: Brand controls model options
- **WHEN** an administrator changes the selected make
- **THEN** the model list is reloaded for that make, stale model and trim selections are cleared, and no trim request is sent until a model is selected

#### Scenario: Model controls trim options
- **WHEN** an administrator changes the selected model
- **THEN** the trim list is reloaded for that model, stale trim selection is cleared, and trim metadata can populate dependent specification fields

#### Scenario: Debounce repeated parent changes
- **WHEN** an administrator changes a parent field repeatedly within the configured debounce interval
- **THEN** the system sends only the latest dependent option request and ignores stale responses

### Requirement: Declarative option dependency configuration
The admin vehicle and definition workflows SHALL define dropdown dependency behavior through configuration rather than component-specific request logic.

#### Scenario: Configure dependent option source
- **WHEN** a developer defines an option field dependency
- **THEN** the configuration supports parent field keys, service method names, path variables, query parameters, mapping rules, cache policy, debounce interval, search fields, empty state copy, and retry behavior

#### Scenario: Reuse dependency configuration
- **WHEN** both the admin vehicle editor and Define Vehicle Data screens need make, model, or trim options
- **THEN** they can consume the same option loader contract without duplicating HTTP wiring in each component

### Requirement: Admin vehicle server validation feedback
The admin vehicle create and edit flows SHALL surface server-side validation errors as field-level feedback.

#### Scenario: Server rejects invalid taxonomy hierarchy
- **WHEN** an administrator submits make, model, and trim values that do not belong to the same tenant hierarchy
- **THEN** the server rejects the mutation and the UI displays field-level feedback without losing entered form values

#### Scenario: Server rejects inactive option selection
- **WHEN** an administrator submits a new listing with an inactive condition, color, or catalog option
- **THEN** the server rejects the mutation and identifies the invalid field

#### Scenario: Retry failed save
- **WHEN** an admin vehicle save fails because of a transient server or network error
- **THEN** the UI keeps the form state and allows the administrator to retry the save

### Requirement: Admin definition server-side list processing
The Define Vehicle Data screens SHALL use server-side filtering, sorting, searching, and pagination.

#### Scenario: Filter definition rows
- **WHEN** an administrator filters definition records by keyword, active state, parent make, parent model, sort order, page, or page size
- **THEN** the UI sends those parameters to the server and renders the returned result envelope

#### Scenario: Avoid client-side full-table filtering
- **WHEN** a definition screen loads records for a vehicle definition entity
- **THEN** the UI MUST NOT require loading every row for that entity before filtering, sorting, or paginating the visible table

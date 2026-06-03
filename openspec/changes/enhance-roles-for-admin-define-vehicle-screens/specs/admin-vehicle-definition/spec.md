## ADDED Requirements

### Requirement: Admin vehicle definition module entry
The system SHALL provide a lazy-loaded admin vehicle definition module reachable only by users with admin or system-owner access.

#### Scenario: Authorized user opens definitions module
- **WHEN** a user with `admin` or `system-owner` role activates the vehicle definitions route
- **THEN** the system displays the admin vehicle definition dashboard with links to each definition screen

#### Scenario: Unauthorized user is blocked
- **WHEN** a user without admin/system-owner access activates the vehicle definitions route
- **THEN** the system prevents access and displays or redirects to a localized access-denied state

### Requirement: Separate vehicle definition CRUD screens
The system SHALL provide separate admin CRUD screens for car make, car model, trim, transmission, engine, fuel type, body type, and condition.

#### Scenario: Definition screen opens
- **WHEN** an authorized admin opens any vehicle definition entity screen
- **THEN** the screen displays a searchable list, loading state, create action, edit action, delete action, and localized empty/error states for that entity

#### Scenario: Definition record is created
- **WHEN** an authorized admin submits a valid create form for a vehicle definition entity
- **THEN** the server creates a tenant-scoped record, the list refreshes or updates optimistically, and the UI announces success

#### Scenario: Definition record is updated
- **WHEN** an authorized admin submits valid edits for an existing vehicle definition entity
- **THEN** the server persists the changes, the list reflects the new values, and the UI announces success

#### Scenario: Definition record is deleted
- **WHEN** an authorized admin confirms deletion of a vehicle definition record that is safe to delete
- **THEN** the server deletes or deactivates the record according to referential integrity rules and the UI announces success

### Requirement: Definition CRUD validation
The system SHALL validate vehicle definition data on the client and server before persistence.

#### Scenario: Required name missing
- **WHEN** an authorized admin submits a definition form without a required display name
- **THEN** the UI blocks submission and displays an inline localized validation message

#### Scenario: Duplicate normalized name rejected
- **WHEN** an admin submits a definition record whose normalized name duplicates another record in the same tenant and parent scope
- **THEN** the server rejects the request with a localized validation error

#### Scenario: Invalid parent relationship rejected
- **WHEN** an admin creates or edits a model without a valid make or a trim without a valid model
- **THEN** the server rejects the request and does not persist an orphaned relationship

### Requirement: Definition screen accessibility
The admin vehicle definition screens SHALL support keyboard operation, focus management, ARIA labels, WCAG AA contrast, and screen-reader announcements for CRUD outcomes.

#### Scenario: Dialog focus is managed
- **WHEN** an admin opens a create, edit, or delete confirmation dialog
- **THEN** focus moves into the dialog and returns to the invoking control after the dialog closes

#### Scenario: Keyboard-only CRUD flow
- **WHEN** an admin uses only a keyboard to search, create, edit, save, cancel, or delete
- **THEN** all controls are reachable and operable in a predictable order

#### Scenario: CRUD outcome is announced
- **WHEN** a create, update, delete, or network failure occurs
- **THEN** the UI provides a screen-reader friendly announcement and visible localized feedback

### Requirement: Users and roles admin utility
The admin module SHALL provide a read-only users-and-roles utility with search and filtering.

#### Scenario: Users and roles utility opens
- **WHEN** an authorized admin opens the users-and-roles utility
- **THEN** the screen displays users, active status, and role membership with search and role filters

#### Scenario: Role editing is unavailable
- **WHEN** an admin views a user row in this change
- **THEN** the UI does not provide role editing controls

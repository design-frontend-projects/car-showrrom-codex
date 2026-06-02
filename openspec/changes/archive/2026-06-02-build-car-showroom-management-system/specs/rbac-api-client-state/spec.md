## ADDED Requirements

### Requirement: Showroom authorization state
Angular client and admin routes SHALL use authenticated session and RBAC state to determine whether listing management and request review actions are available.

#### Scenario: Client menu visibility
- **WHEN** a logged-in client has listing-management permission
- **THEN** the app shell and client area expose sell/manage listing navigation

#### Scenario: Admin menu visibility
- **WHEN** a logged-in user lacks request-review permission
- **THEN** the app MUST NOT show administrative request review navigation

### Requirement: API authorization errors
Showroom Angular services SHALL surface server authorization failures as stable localized UI states.

#### Scenario: Permission denied response
- **WHEN** a showroom API returns an authorization error
- **THEN** the UI displays a localized access-denied state and does not continue optimistic updates

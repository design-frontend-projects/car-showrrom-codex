## ADDED Requirements

### Requirement: Role-aware session hydration
The system SHALL hydrate the sanitized logged-in user object and normalized role list into NgRx Signal Store state after login, session restoration, token or session refresh, and explicit role refresh.

#### Scenario: Login hydrates user and roles
- **WHEN** a user successfully logs in
- **THEN** the auth/RBAC store contains the sanitized user object, normalized role names, tenant context, loading status, and derived admin/system-owner flags

#### Scenario: Session restoration hydrates store
- **WHEN** the application starts with valid persisted auth state and a valid server session
- **THEN** the store is rehydrated from storage and reconciled with the server session response

#### Scenario: Role refresh updates derived flags
- **WHEN** the server reports changed role membership for the current user
- **THEN** the store updates the role list and recalculates derived authorization flags without requiring a full page reload

### Requirement: Configurable browser auth state persistence
The system SHALL persist only sanitized user and role state to configurable browser storage while keeping the NgRx Signal Store and storage synchronized.

#### Scenario: Session storage mode is configured
- **WHEN** the auth persistence configuration selects session storage
- **THEN** sanitized user and role state is written to `sessionStorage` and restored from `sessionStorage`

#### Scenario: Local storage mode is configured
- **WHEN** the auth persistence configuration explicitly selects local storage
- **THEN** sanitized user and role state is written to `localStorage` and restored from `localStorage`

#### Scenario: Logout clears persisted state
- **WHEN** the current user logs out or the server rejects the session as unauthorized
- **THEN** the store is reset and the persisted user and role state is removed from browser storage

### Requirement: Sensitive auth data exclusion
Angular auth persistence SHALL NOT store sensitive authentication secrets or server-only security fields in NgRx state intended for display or browser storage.

#### Scenario: Persisted state is inspected
- **WHEN** the serialized auth state in browser storage is inspected
- **THEN** it contains no password hash, session token, CSRF token hash, TOTP secret, pending TOTP secret, backup code, reset OTP, failed login count, or lockout internals

#### Scenario: Store user DTO is inspected
- **WHEN** the NgRx auth/RBAC store state is inspected
- **THEN** it contains only sanitized user, tenant, status, and role fields approved by the server DTO contract

### Requirement: Admin route and navigation authorization state
Angular navigation and route guards SHALL use the centralized auth/RBAC store to determine admin module visibility and access.

#### Scenario: Admin user sees admin button
- **WHEN** the current store roles include `admin` or `system-owner`
- **THEN** the application shell displays an accessible Admin module button that navigates to the admin module

#### Scenario: Non-admin user does not see admin button
- **WHEN** the current store roles do not include `admin` or `system-owner`
- **THEN** the application shell does not render the Admin module button

#### Scenario: Non-admin route access is blocked
- **WHEN** a non-admin user attempts to activate an admin route directly by URL
- **THEN** the route guard prevents activation and shows or redirects to a localized access-denied destination

### Requirement: Users and roles read model
Angular SHALL provide a read-only admin data model and state flow for displaying users and their role membership.

#### Scenario: Admin loads users and roles
- **WHEN** an authorized admin opens the users-and-roles utility
- **THEN** the UI displays sanitized users with role membership, active status, tenant context, and loading/error states

#### Scenario: User role list is searched
- **WHEN** an admin enters search or filter criteria
- **THEN** the displayed user-role list updates without exposing sensitive user fields

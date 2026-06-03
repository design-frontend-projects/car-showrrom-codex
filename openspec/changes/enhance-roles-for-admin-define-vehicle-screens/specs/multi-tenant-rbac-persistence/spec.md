## ADDED Requirements

### Requirement: Admin definition API authorization
The system SHALL enforce server-side authorization for every admin vehicle definition API using the authenticated session identity and tenant-scoped role membership.

#### Scenario: Admin role can access definition API
- **WHEN** an authenticated user with the `admin` role in the active tenant calls an admin vehicle definition API
- **THEN** the server authorizes the request after validating tenant access

#### Scenario: System owner can access definition API
- **WHEN** an authenticated user with the `system-owner` role calls an admin vehicle definition API
- **THEN** the server authorizes the request according to the system-owner tenant access policy

#### Scenario: Non-admin role is rejected
- **WHEN** an authenticated user without `admin` or `system-owner` role membership calls an admin vehicle definition API
- **THEN** the server rejects the request with a forbidden response and performs no mutation

### Requirement: Role normalization for authorization
The system SHALL normalize role names before evaluating admin/system-owner access.

#### Scenario: Role names are normalized
- **WHEN** role membership is loaded from the database or auth API
- **THEN** role names are trimmed and compared using canonical role keys such as `admin` and `system-owner`

#### Scenario: Unknown role does not grant access
- **WHEN** a user has a role name that is not mapped to an accepted admin role key
- **THEN** the system does not grant admin navigation or admin API authorization from that role

### Requirement: Users and roles read API
The system SHALL expose an admin-only read API that returns sanitized users and role membership for the active tenant.

#### Scenario: Authorized admin fetches users and roles
- **WHEN** an authorized admin requests the tenant users-and-roles list
- **THEN** the server returns users with safe identity fields, active status, timestamps, and role names

#### Scenario: Users and roles API excludes secrets
- **WHEN** the users-and-roles API response is inspected
- **THEN** it contains no password hashes, session token hashes, CSRF token hashes, TOTP secrets, backup codes, reset OTPs, or lockout internals

#### Scenario: Non-admin fetch is rejected
- **WHEN** a non-admin user requests the users-and-roles list
- **THEN** the server rejects the request with a forbidden response

### Requirement: Admin audit trail for definition changes
The system SHALL record audit events for successful create, update, and delete operations on vehicle definition entities.

#### Scenario: Create audit event is recorded
- **WHEN** an authorized admin creates a vehicle definition record
- **THEN** the server records an audit event with actor, tenant, action, target type, target identifier, and metadata

#### Scenario: Failed authorization is not persisted as mutation
- **WHEN** an unauthorized user attempts a vehicle definition mutation
- **THEN** the target data is unchanged and any security log does not imply a successful create, update, or delete

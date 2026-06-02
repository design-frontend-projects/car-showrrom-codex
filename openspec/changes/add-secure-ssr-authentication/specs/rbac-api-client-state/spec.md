## ADDED Requirements

### Requirement: Session identity drives RBAC authorization
The system SHALL use the authenticated server session identity as the trusted principal for RBAC API authorization and tenant-context validation.

#### Scenario: Authenticated RBAC request
- **WHEN** an authenticated user calls a tenant-scoped RBAC API route
- **THEN** the server resolves the user from the session cookie and validates tenant access before executing RBAC database work

#### Scenario: Anonymous RBAC request
- **WHEN** a request without a valid auth session calls an RBAC API route
- **THEN** the server rejects the request as unauthorized and does not set tenant database context

### Requirement: Auth failure updates RBAC client state consistently
The system SHALL keep RBAC services and stores consistent when auth session expiry, forbidden access, or tenant-context failures occur.

#### Scenario: Session expires during RBAC request
- **WHEN** an RBAC API request returns unauthorized because the auth session expired
- **THEN** the auth store becomes anonymous and the relevant RBAC store records an auth error without exposing stale privileged actions

#### Scenario: Forbidden tenant access
- **WHEN** an authenticated user requests a tenant they cannot access
- **THEN** the RBAC store records a forbidden error while preserving unrelated loaded data

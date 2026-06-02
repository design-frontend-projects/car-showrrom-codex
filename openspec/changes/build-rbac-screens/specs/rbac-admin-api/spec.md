## ADDED Requirements

### Requirement: Authenticated RBAC admin API
The system SHALL expose tenant-scoped RBAC administration API routes that require an authenticated session and administrative authorization.

#### Scenario: Authorized admin calls RBAC admin endpoint
- **WHEN** an authenticated user with `showroom.admin.manage`, `admin`, or `system-owner` access calls a RBAC admin API route for an accessible tenant
- **THEN** the server executes the request within validated tenant database context

#### Scenario: Unauthorized user calls RBAC admin endpoint
- **WHEN** an anonymous user or non-admin tenant member calls a RBAC admin API route
- **THEN** the server rejects the request before performing Prisma writes

### Requirement: Server-owned user creation
The system SHALL create users through server-side validation and password hashing without accepting password hashes from browser clients.

#### Scenario: Admin creates active user
- **WHEN** an administrator submits valid user profile fields, initial password input or server-generated setup option, and initial roles
- **THEN** the server creates the user, hashes any password server-side, assigns roles within the same tenant, records an audit event, and returns a sanitized user DTO

#### Scenario: Browser submits password hash
- **WHEN** a browser request includes a password hash or secret-bearing user field
- **THEN** the server ignores or rejects that field and does not persist client-supplied hashes

### Requirement: Invitation lifecycle API
The system SHALL support tenant-scoped invitation creation, listing, revocation, resend, and acceptance using hashed invitation tokens.

#### Scenario: Admin creates invitation
- **WHEN** an administrator invites a new email address with initial roles
- **THEN** the server stores only a hashed invitation token, expiry metadata, inviter user ID, target roles, and pending state

#### Scenario: Invitation is accepted
- **WHEN** a valid unexpired invitation token is accepted with required registration details
- **THEN** the server creates or activates the tenant user, assigns invitation roles, marks the invitation accepted, starts the appropriate auth flow, and records an audit event

#### Scenario: Invitation is revoked
- **WHEN** an administrator revokes a pending invitation
- **THEN** the server marks the invitation revoked and future acceptance attempts fail

### Requirement: Role and permission administration API
The system SHALL provide endpoints for role CRUD, permission catalog management, user-role assignment, and role-permission assignment with tenant-scoped integrity.

#### Scenario: Role assignment is changed
- **WHEN** an administrator assigns or removes a role for a user
- **THEN** the server verifies the user and role belong to the request tenant, applies the assignment mutation, and records an audit event

#### Scenario: Role permission assignment is changed
- **WHEN** an administrator toggles a permission for a role
- **THEN** the server verifies the role and permission belong to the request tenant, applies the assignment mutation, and records an audit event

#### Scenario: System role delete is requested
- **WHEN** a delete request targets a system role
- **THEN** the server rejects the deletion even if the client attempted to enable the action

### Requirement: RBAC admin DTO safety
The system SHALL return sanitized DTOs from RBAC admin APIs and MUST NOT return password hashes, session token hashes, CSRF hashes, reset OTPs, TOTP secrets, backup code hashes, or raw invitation tokens.

#### Scenario: User DTO is inspected
- **WHEN** a RBAC admin user response is returned
- **THEN** it contains profile, status, tenant, roles, timestamps, and safe metadata only

#### Scenario: Invitation DTO is inspected
- **WHEN** a RBAC admin invitation response is returned
- **THEN** it contains pending state and delivery metadata but no stored token hash

### Requirement: RBAC admin validation and CSRF protection
The system SHALL validate RBAC admin request payloads and enforce CSRF checks for cookie-authenticated mutations.

#### Scenario: Invalid RBAC admin payload
- **WHEN** a request contains malformed email, duplicate role name, invalid UUID, invalid permission action, or missing required fields
- **THEN** the server returns structured validation errors without partial writes

#### Scenario: Missing CSRF token on mutation
- **WHEN** a cookie-authenticated RBAC admin mutation omits or mismatches the CSRF token
- **THEN** the server rejects the request before authorization-sensitive work executes

### Requirement: RBAC audit API
The system SHALL expose read-only RBAC audit activity for administrators using tenant-scoped audit events.

#### Scenario: Admin lists audit events
- **WHEN** an authorized administrator requests audit activity
- **THEN** the server returns paginated events for the tenant ordered by newest first

#### Scenario: Audit metadata contains secret candidate
- **WHEN** an audit event is recorded for a sensitive workflow
- **THEN** the server stores sanitized metadata that excludes raw passwords, hashes, tokens, OTPs, TOTP secrets, and backup codes

## ADDED Requirements

### Requirement: RBAC admin Angular services
The system SHALL provide Angular services for RBAC administration workflows using the existing reusable HTTP API wrapper and tenant context propagation.

#### Scenario: User administration service calls API
- **WHEN** Angular code lists users, creates users, updates users, disables users, assigns roles, invites users, revokes invitations, resends invitations, or initiates resets
- **THEN** the user administration service performs authorized API requests without importing server-only packages

#### Scenario: Role administration service calls API
- **WHEN** Angular code creates roles, edits roles, deletes roles, loads role details, or updates role-permission assignments
- **THEN** the role administration service performs authorized API requests through the shared API wrapper

#### Scenario: Audit service calls API
- **WHEN** Angular code loads RBAC audit activity
- **THEN** the audit service fetches paginated audit DTOs through the shared API wrapper

### Requirement: RBAC admin Signal Store state
The system SHALL provide client state for RBAC admin screens that tracks loaded data, selected filters, mutation status, and errors without storing secrets.

#### Scenario: User administration state loads
- **WHEN** the user administration screen loads
- **THEN** the store tracks active users, disabled users, pending invitations, loading state, and error state

#### Scenario: Role administration state changes
- **WHEN** a role or assignment mutation completes
- **THEN** the store updates role summaries, role details, user assignments, and permission matrix state consistently

#### Scenario: Store state is inspected
- **WHEN** RBAC admin client state is inspected
- **THEN** it contains no password hash, raw password, raw invitation token, invitation token hash, reset OTP, session token, CSRF hash, TOTP secret, or backup code

### Requirement: RBAC admin grouped permission model
The system SHALL expose permissions to screens as grouped modules suitable for list and matrix presentation.

#### Scenario: Permission action contains module prefix
- **WHEN** permission actions such as `showroom.requests.review` are loaded
- **THEN** the client groups them by module prefix or server-provided grouping metadata

#### Scenario: Permission group has no display metadata
- **WHEN** a permission group lacks a localized label
- **THEN** the UI falls back to a stable readable label derived from the action prefix

### Requirement: RBAC admin authorization errors in state
The system SHALL preserve loaded data while recording authorization, validation, and tenant-context errors from RBAC admin API calls.

#### Scenario: Forbidden assignment mutation
- **WHEN** a role assignment request returns forbidden
- **THEN** the relevant store records the forbidden error, rolls back pending mutation state, and preserves unrelated loaded users and roles

#### Scenario: Session expiry during admin request
- **WHEN** a RBAC admin API request returns unauthorized because the session expired
- **THEN** authenticated state becomes anonymous and RBAC admin stores stop exposing privileged pending actions

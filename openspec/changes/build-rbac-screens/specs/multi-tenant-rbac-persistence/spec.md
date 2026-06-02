## ADDED Requirements

### Requirement: Tenant-scoped invitation persistence
The system SHALL persist user invitations as tenant-scoped records that store hashed tokens and invitation lifecycle metadata.

#### Scenario: Invitation record is created
- **WHEN** an administrator invites a user to a tenant
- **THEN** the database stores tenant ID, normalized email, display name, hashed token, expiry timestamp, inviter user ID, target role metadata, and pending lifecycle state

#### Scenario: Invitation token is inspected in storage
- **WHEN** invitation persistence is inspected
- **THEN** raw invitation tokens are not stored in any table

#### Scenario: Tenant deletion removes invitations
- **WHEN** a tenant is deleted
- **THEN** pending, accepted, expired, and revoked invitation records for that tenant are deleted or made unreachable through cascade behavior

### Requirement: RBAC audit event persistence
The system SHALL persist tenant-scoped audit events for RBAC administration actions.

#### Scenario: RBAC mutation records audit event
- **WHEN** a user, invitation, role, permission, user-role assignment, or role-permission assignment is created, updated, revoked, deleted, accepted, or reset through the RBAC admin API
- **THEN** the database records an audit event with tenant ID, actor user ID, action, target type, target ID when available, timestamp, and sanitized metadata

#### Scenario: Audit metadata excludes secrets
- **WHEN** audit metadata is stored
- **THEN** it MUST NOT contain raw passwords, password hashes, session tokens, CSRF tokens, reset OTPs, TOTP secrets, backup codes, raw invitation tokens, or invitation token hashes

#### Scenario: Audit event lookup is indexed
- **WHEN** administrators list audit events for a tenant
- **THEN** the database supports efficient tenant and timestamp ordered lookup through indexes

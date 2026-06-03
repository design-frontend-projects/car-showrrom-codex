## ADDED Requirements

### Requirement: Invitation persistence contract
The system SHALL use the Prisma `UserInvitation` model as the canonical persistence structure for invited users.

#### Scenario: Invitation fields match Prisma schema
- **WHEN** invitation records are created, read, resent, revoked, or accepted
- **THEN** persistence uses the exact `UserInvitation` attributes from `prisma/schema.prisma`, including `tenantId`, `email`, `normalizedEmail`, `displayName`, `tokenHash`, `targetRoles`, `status`, `expiresAt`, `acceptedAt`, `revokedAt`, `resentAt`, `inviterUserId`, `resultingUserId`, `createdAt`, and `updatedAt`

#### Scenario: Invitation belongs to tenant
- **WHEN** an invitation is persisted
- **THEN** it is associated with exactly one tenant and all invitation lookups are constrained by tenant context unless a server-verified system-owner bypass is active

#### Scenario: Invitation DTO excludes token hash
- **WHEN** an invitation is returned to Angular or included in an audit payload
- **THEN** `tokenHash` and any raw invitation token are excluded from the response and audit metadata

### Requirement: Invitation acceptance user persistence
The system SHALL create or update canonical `User` records during invitation acceptance without using off-schema attributes.

#### Scenario: New user fields are schema-aligned
- **WHEN** acceptance creates a new invited user
- **THEN** the write uses only Prisma `User` attributes, including `tenantId`, `email`, `displayName`, `passwordHash`, optional `phone`, active status defaults, and `passwordChangedAt`

#### Scenario: Existing user fields are schema-aligned
- **WHEN** acceptance updates an existing same-tenant user
- **THEN** the write uses only Prisma `User` attributes and preserves unrelated authentication lifecycle fields unless the accepted onboarding payload explicitly changes them

#### Scenario: Duplicate tenant email is prevented
- **WHEN** acceptance attempts to create a user whose email already exists in the invitation tenant
- **THEN** the server updates the existing same-tenant user or rejects safely without violating the `User` tenant-email uniqueness constraint

### Requirement: Invitation role assignment persistence
The system SHALL assign invitation roles through canonical `UserRole` records using tenant-aware relationships.

#### Scenario: Target roles are revalidated
- **WHEN** an invitation is accepted
- **THEN** every role ID in `UserInvitation.targetRoles` is revalidated against the invitation tenant before any user-role assignment is written

#### Scenario: User roles are upserted
- **WHEN** validated target roles are assigned to the accepted user
- **THEN** each role is represented by a `UserRole` row using `tenantId`, `userId`, `roleId`, and default `assignedAt` without creating duplicate assignments

#### Scenario: Cross-tenant role assignment is rejected
- **WHEN** an invitation references a role outside the invitation tenant
- **THEN** the server rejects acceptance and no `UserRole` row is created

### Requirement: Invitation audit trail
The system SHALL record RBAC audit events for invitation creation, resend, revocation, and acceptance.

#### Scenario: Invitation acceptance audit event is recorded
- **WHEN** an invitation is accepted
- **THEN** the server records an `RbacAuditEvent` with tenant, actor when available, action, target type `invitation`, target invitation identifier, resulting user identifier in safe metadata, and no password, token, OTP, TOTP, backup-code, or session secret values

#### Scenario: Failed invitation acceptance is not audited as success
- **WHEN** invitation acceptance fails validation or authorization
- **THEN** user, role, invitation, and success-audit mutations are not committed

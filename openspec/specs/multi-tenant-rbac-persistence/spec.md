# multi-tenant-rbac-persistence Specification

## Purpose
Define the persistence contract for multi-tenant RBAC, including Prisma models, tenant-scoped integrity, indexes, default roles, and PostgreSQL row-level security.

## Requirements
### Requirement: RBAC Prisma data model
The system SHALL define Prisma models for `Tenant`, `User`, `Role`, `Permission`, `UserRole`, and `RolePermission` with tenant-scoped relationships and generated PostgreSQL tables.

#### Scenario: Prisma schema contains core RBAC models
- **WHEN** a developer inspects `prisma/schema.prisma`
- **THEN** the schema includes models for tenants, users, roles, permissions, user-role assignments, and role-permission assignments

#### Scenario: Tenant owns RBAC records
- **WHEN** a user, role, or permission record is created
- **THEN** it is associated with exactly one tenant through a required tenant relation

### Requirement: Tenant-scoped uniqueness constraints
The system SHALL enforce tenant-scoped uniqueness for role names, permission action keys, and user email addresses.

#### Scenario: Duplicate role name in one tenant is rejected
- **WHEN** two roles with the same name are created for the same tenant
- **THEN** PostgreSQL rejects the duplicate through a unique constraint

#### Scenario: Same role name in different tenants is allowed
- **WHEN** two tenants each create a role named `manager`
- **THEN** both role records can exist because role names are unique per tenant

#### Scenario: Duplicate user email in one tenant is rejected
- **WHEN** two users with the same email address are created for the same tenant
- **THEN** PostgreSQL rejects the duplicate through a unique constraint

### Requirement: RBAC assignment integrity
The system SHALL prevent user-role and role-permission assignments from linking records that belong to different tenants.

#### Scenario: User role assignment stays within tenant
- **WHEN** a user-role assignment is inserted
- **THEN** the referenced user and role MUST belong to the assignment tenant

#### Scenario: Role permission assignment stays within tenant
- **WHEN** a role-permission assignment is inserted
- **THEN** the referenced role and permission MUST belong to the assignment tenant

#### Scenario: Duplicate assignments are rejected
- **WHEN** the same role is assigned twice to the same user in one tenant
- **THEN** PostgreSQL rejects the duplicate assignment through a composite unique constraint

### Requirement: RBAC indexes
The system SHALL define indexes that support efficient tenant, user, role, and permission lookups.

#### Scenario: Tenant-scoped records are indexed
- **WHEN** the Prisma schema is validated
- **THEN** RBAC models include indexes on tenant identifiers used for tenant filtering

#### Scenario: Assignment joins are indexed
- **WHEN** authorization checks join users, roles, and permissions
- **THEN** user-role and role-permission tables expose indexes on `userId`, `roleId`, `permissionId`, and relevant composite lookup fields

### Requirement: Cascading RBAC deletes
The system SHALL cascade deletes from tenants to tenant-owned users, roles, permissions, and assignment records where preserving orphaned RBAC data would be invalid.

#### Scenario: Tenant deletion removes RBAC records
- **WHEN** a tenant is deleted
- **THEN** its users, roles, permissions, user-role assignments, and role-permission assignments are deleted by foreign-key cascade behavior

#### Scenario: Role deletion removes related mappings
- **WHEN** a role is deleted
- **THEN** its user-role assignments and role-permission assignments are deleted by foreign-key cascade behavior

### Requirement: Required RBAC roles
The system SHALL provide the required role names `guest`, `manager`, `admin`, `showroom-manager`, and `system-owner` for RBAC initialization.

#### Scenario: Required roles are initialized
- **WHEN** RBAC seed or initialization runs for a tenant
- **THEN** the tenant has role records for `guest`, `manager`, `admin`, `showroom-manager`, and `system-owner`

#### Scenario: Role initialization is idempotent
- **WHEN** RBAC initialization runs more than once for the same tenant
- **THEN** it does not create duplicate role records

### Requirement: Tenant row-level security policies
The system SHALL enable PostgreSQL row-level security on tenant-scoped RBAC tables and restrict access by application tenant context.

#### Scenario: Tenant-scoped RLS is enabled
- **WHEN** the RBAC migration is applied
- **THEN** RLS is enabled on users, roles, permissions, user-role assignments, and role-permission assignments

#### Scenario: Tenant context filters rows
- **WHEN** the database session has `app.tenant_id` set to a tenant ID
- **THEN** tenant-scoped RBAC queries only return rows whose tenant ID matches that setting

#### Scenario: Missing tenant context denies tenant data
- **WHEN** the database session does not have a tenant context or bypass context
- **THEN** tenant-scoped RBAC queries do not expose tenant data

### Requirement: System-owner RLS bypass
The system SHALL allow a verified system-owner context to bypass tenant RLS restrictions through server-controlled database settings.

#### Scenario: Verified bypass can read across tenants
- **WHEN** trusted server code sets the system-owner bypass setting for an authorized request
- **THEN** RBAC policies allow access to tenant-scoped RBAC rows across tenants

#### Scenario: Tenant header cannot grant bypass
- **WHEN** a browser request includes tenant context headers
- **THEN** those headers MUST NOT grant RLS bypass unless server-side authorization verifies the caller as system-owner

### Requirement: Prisma migration verification
The system SHALL keep the RBAC Prisma schema and PostgreSQL migration compatible with the existing Prisma 7 setup.

#### Scenario: Prisma validation succeeds
- **WHEN** a developer runs `npm run prisma:validate`
- **THEN** Prisma validates the RBAC schema without errors

#### Scenario: Prisma client generation succeeds
- **WHEN** a developer runs `npm run prisma:generate`
- **THEN** the generated client includes the RBAC models under the configured generated output path

### Requirement: User auth lifecycle fields
The canonical `User` model SHALL include authentication lifecycle fields needed for secure registration, login, reset, and 2FA without weakening tenant-scoped RBAC constraints.

#### Scenario: User model includes auth lifecycle metadata
- **WHEN** a developer inspects `prisma/schema.prisma`
- **THEN** the `User` model includes fields for password hash, password-change metadata, 2FA state, account lock/failure controls, and session/reset/backup-code relations

#### Scenario: Tenant email uniqueness is preserved
- **WHEN** auth fields are added to the `User` model
- **THEN** tenant-scoped user email uniqueness remains enforced by PostgreSQL constraints

### Requirement: Auth persistence relationships
The system SHALL define Prisma models and indexes for sessions, password reset OTPs, and 2FA backup codes related to the canonical `User` model.

#### Scenario: Session records belong to users
- **WHEN** an auth session is created
- **THEN** it references exactly one user, stores only a hashed session token, and can be revoked without deleting the user

#### Scenario: Reset OTP records belong to users
- **WHEN** a reset OTP is created for an existing account
- **THEN** it references that user and stores hashed OTP, expiry, attempts, verified, and consumed lifecycle metadata

#### Scenario: Backup code records belong to users
- **WHEN** 2FA backup codes are generated
- **THEN** each code record references that user, stores only a hash, and records whether it has been used

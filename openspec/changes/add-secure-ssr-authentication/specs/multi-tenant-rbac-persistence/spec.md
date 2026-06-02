## ADDED Requirements

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

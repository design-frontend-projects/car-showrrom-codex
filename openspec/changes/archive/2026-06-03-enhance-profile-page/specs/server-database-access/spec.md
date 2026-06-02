## ADDED Requirements

### Requirement: Server-only current profile data access
The system SHALL load current-user profile data through server-side code under `src/server/**` and MUST NOT expose Prisma or PostgreSQL driver imports to Angular browser code.

#### Scenario: Profile route reads through server
- **WHEN** an authenticated browser requests current profile data
- **THEN** the server resolves the session and reads the corresponding `users` table record through server-only Prisma access

#### Scenario: Browser code remains database-free
- **WHEN** Angular code under `src/app/**` is inspected
- **THEN** it does not import Prisma Client, `@prisma/adapter-pg`, `pg`, or server profile modules

### Requirement: Sanitized profile DTO
The system SHALL return a sanitized profile DTO that includes only fields safe for the current authenticated user to view.

#### Scenario: Profile DTO returned
- **WHEN** the server returns current profile data
- **THEN** the response includes safe identity, contact, tenant, role, status, 2FA, and account timestamp fields

#### Scenario: Sensitive fields excluded
- **WHEN** the profile DTO is inspected
- **THEN** it MUST NOT include password hashes, session token hashes, CSRF hashes, TOTP secrets, pending TOTP secrets, backup codes, reset OTPs, failed login counts, or lockout internals

### Requirement: Session-bound profile lookup
The system SHALL bind profile lookup to the authenticated session rather than accepting an arbitrary user ID from the client.

#### Scenario: Profile request has no user id parameter
- **WHEN** the profile endpoint is called
- **THEN** the server derives the user ID from the session cookie and ignores any attempt to read another user's profile

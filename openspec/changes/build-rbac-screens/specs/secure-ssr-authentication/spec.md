## ADDED Requirements

### Requirement: Admin-initiated user setup
The system SHALL allow authorized administrators to create or invite tenant users without exposing password hashes, reset OTPs, session secrets, or invitation token hashes to browser code.

#### Scenario: Admin creates user with setup flow
- **WHEN** an administrator creates a user through RBAC administration
- **THEN** password hashing, setup token generation, and session-sensitive work happen only on the server

#### Scenario: Browser bundle is inspected
- **WHEN** Angular RBAC administration code is inspected
- **THEN** it does not import hashing libraries, Prisma, PostgreSQL packages, auth server modules, or secret-bearing environment variables

### Requirement: Admin reset initiation
The system SHALL support administrator-initiated password reset for tenant users through the existing secure reset flow.

#### Scenario: Admin initiates reset
- **WHEN** an authorized administrator requests a password reset for a user
- **THEN** the server creates the reset challenge through server-only auth logic and returns only sanitized delivery or status metadata

#### Scenario: Disabled user reset is requested
- **WHEN** an administrator requests a reset for a disabled user
- **THEN** the server rejects the reset or returns a disabled-account state without creating a usable reset challenge

### Requirement: Disabled account awareness
The system SHALL consistently prevent disabled users from authenticating or exercising RBAC permissions.

#### Scenario: Disabled user attempts login
- **WHEN** a disabled user submits valid credentials
- **THEN** the server rejects authentication and does not create a full authenticated session

#### Scenario: Existing disabled session is checked
- **WHEN** a session belongs to a user who has since been disabled
- **THEN** session introspection treats the session as invalid or unauthorized and does not return privileged roles or permissions

### Requirement: Invitation acceptance auth handoff
The system SHALL hand accepted invitations into the secure registration or session flow without exposing invitation secrets.

#### Scenario: Valid invitation accepted
- **WHEN** a user accepts a valid invitation with required profile and password inputs
- **THEN** the server validates the invitation token hash, creates or activates the user, hashes the password server-side, and returns a sanitized auth response

#### Scenario: Expired invitation accepted
- **WHEN** a user attempts to accept an expired, revoked, consumed, or invalid invitation
- **THEN** the server rejects the request with a safe validation error and does not reveal whether another account exists

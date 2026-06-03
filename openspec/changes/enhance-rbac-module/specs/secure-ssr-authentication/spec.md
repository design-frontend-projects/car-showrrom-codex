## ADDED Requirements

### Requirement: Invited identity login recognition
The system SHALL extend server-side login behavior to identify pending invited identities without granting normal authenticated access.

#### Scenario: Pending invited email is recognized
- **WHEN** a first-time invited person submits an email that matches a pending, unexpired, non-revoked invitation in the selected tenant context
- **THEN** the auth API returns an onboarding-required response or challenge that allows only invited-user password setup and does not set a full session cookie

#### Scenario: Accepted invitation uses normal credentials
- **WHEN** a user whose invitation has already been accepted submits valid email and password credentials
- **THEN** the normal login flow authenticates the canonical `User` and hydrates roles from `UserRole`

#### Scenario: Unknown email remains generic
- **WHEN** a submitted email does not match an active user or an eligible pending invitation
- **THEN** the server returns a generic authentication error and does not reveal whether a tenant, invitation, or user exists

### Requirement: Secure invitation onboarding challenge
The system SHALL protect invited-user onboarding endpoints with a valid invitation token or server-issued onboarding challenge.

#### Scenario: Onboarding challenge is limited
- **WHEN** the server issues onboarding access for a pending invitation
- **THEN** the challenge is scoped to the invitation, expires independently of full auth sessions, and cannot access protected client or admin routes

#### Scenario: Onboarding mutation validates challenge
- **WHEN** an invited user submits first-password setup
- **THEN** the server verifies the invitation token or onboarding challenge before hashing the password or writing user and role records

#### Scenario: Tampered challenge is rejected
- **WHEN** an onboarding request includes a missing, expired, malformed, or tampered challenge
- **THEN** the server rejects the request and performs no user, role, invitation, session, or audit success write

### Requirement: Onboarding auth route security controls
The system SHALL apply auth-route security controls to invited-user onboarding.

#### Scenario: Onboarding is rate limited
- **WHEN** a client exceeds configured limits for invitation lookup or password setup attempts
- **THEN** the server rejects additional attempts with a translated rate-limit error key and does not leak invitation state

#### Scenario: Onboarding excludes secret data
- **WHEN** the onboarding API response is inspected
- **THEN** it contains no password hash, token hash, raw session token, CSRF token hash, TOTP secret, backup code, reset OTP, failed login count, or lockout internals

#### Scenario: Full session starts only after login
- **WHEN** invited-user onboarding succeeds
- **THEN** the server clears temporary onboarding state and requires the user to authenticate through the normal login endpoint before a full session is created

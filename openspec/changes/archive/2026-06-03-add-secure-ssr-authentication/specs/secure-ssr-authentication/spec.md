## ADDED Requirements

### Requirement: Registration with canonical user persistence
The system SHALL expose a server-side registration endpoint that validates input, normalizes email addresses, checks tenant-scoped email uniqueness, hashes passwords, and creates users through the canonical Prisma `User` model.

#### Scenario: Successful registration
- **WHEN** an anonymous user submits valid registration details for an email that is not already used in the target tenant
- **THEN** the server creates a `User` record with a hashed password, starts a secure session, and returns a sanitized auth session DTO without password or secret fields

#### Scenario: Duplicate registration email
- **WHEN** an anonymous user submits registration details with an email already used in the target tenant
- **THEN** the server rejects the request with a translated validation error key and does not create a second user

#### Scenario: Invalid registration payload
- **WHEN** an anonymous user submits a malformed email, weak password, missing display name, or invalid tenant context
- **THEN** the server rejects the request before writing to the database and returns field-level validation error keys

### Requirement: Login and session cookies
The system SHALL authenticate users server-side and maintain SSR-compatible sessions using secure HttpOnly cookies instead of browser-stored access tokens.

#### Scenario: Login succeeds without 2FA requirement
- **WHEN** an active user submits a valid email and password and no 2FA challenge is required
- **THEN** the server rotates the session identifier, sets a secure HttpOnly session cookie, records login metadata, and returns the sanitized current user

#### Scenario: Invalid login credentials
- **WHEN** a user submits an unknown email or incorrect password
- **THEN** the server rejects the request with a generic authentication error key, increments applicable failure controls, and does not reveal whether the email exists

#### Scenario: Login requires 2FA
- **WHEN** a user with required or enabled 2FA submits a valid email and password
- **THEN** the server creates a limited pending challenge and does not create a full authenticated session until a valid TOTP or backup code is verified

### Requirement: Session introspection and refresh
The system SHALL provide same-origin auth endpoints for reading and refreshing the current session in SSR and browser hydration without exposing session secrets.

#### Scenario: Current session exists
- **WHEN** Angular SSR or browser code calls the session endpoint with a valid session cookie
- **THEN** the server returns the current sanitized user, tenant context, roles, session expiry, and 2FA status without returning tokens or secret fields

#### Scenario: Session is expired or revoked
- **WHEN** Angular SSR or browser code calls the session endpoint with an expired, missing, or revoked session cookie
- **THEN** the server clears the cookie and returns an anonymous session response

#### Scenario: Session refresh succeeds
- **WHEN** an authenticated user calls the refresh endpoint before session expiry
- **THEN** the server rotates or extends the session according to configuration and returns updated session metadata

### Requirement: Local and global signout
The system SHALL support local signout for the current session and global signout for all active sessions belonging to the current user.

#### Scenario: Local signout
- **WHEN** an authenticated user selects local signout
- **THEN** the server revokes the current session, clears the session cookie, and the Angular auth store becomes anonymous

#### Scenario: Global signout
- **WHEN** an authenticated user selects global signout
- **THEN** the server revokes all sessions for that user, clears the current cookie, and any other device receives anonymous state on the next session check

### Requirement: Auth route security controls
The system SHALL apply CSRF protection, payload size limits, input sanitization, secure cookie options, and route-specific rate limits to authentication routes.

#### Scenario: CSRF token missing
- **WHEN** a cookie-authenticated mutation request omits or mismatches the required CSRF token
- **THEN** the server rejects the request before running the auth action

#### Scenario: Rate limit exceeded
- **WHEN** a client exceeds configured limits for login, registration, reset, or 2FA verification routes
- **THEN** the server rejects additional attempts with a translated rate-limit error key and does not leak account state

#### Scenario: Production cookie configuration
- **WHEN** the server runs with production cookie settings
- **THEN** auth cookies are `HttpOnly`, `Secure`, use the configured `SameSite` policy, and are scoped to the configured path/domain

### Requirement: Server-only auth boundary
The system SHALL keep password hashing, session validation, OTP verification, TOTP verification, encryption, Prisma auth writes, and environment secrets isolated to server-side code.

#### Scenario: Browser bundle imports are inspected
- **WHEN** Angular code under `src/app/**` is inspected
- **THEN** it does not import Prisma, `pg`, server auth modules, hashing libraries, encryption helpers, TOTP libraries, or secret-bearing environment variables

#### Scenario: Auth API uses server database access
- **WHEN** an auth endpoint reads or writes users, sessions, reset OTPs, TOTP secrets, or backup codes
- **THEN** it uses server-only Prisma access under `src/server/**`

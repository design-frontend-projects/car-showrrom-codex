## ADDED Requirements

### Requirement: Profile route uses authenticated state
The profile route SHALL use the existing authenticated state and guard behavior to prevent anonymous profile access.

#### Scenario: Auth guard protects profile
- **WHEN** a route activation check runs for `/client/profile`
- **THEN** unauthenticated users are blocked according to existing auth guard behavior

### Requirement: Profile API authorization errors
The Angular profile data layer SHALL surface profile API authorization failures as localized UI states without clearing unrelated authenticated session state.

#### Scenario: Forbidden or unauthorized profile response
- **WHEN** the profile API returns an authorization error while the page is loading
- **THEN** the profile page displays an access error and does not show stale profile details

### Requirement: Profile state does not expose secrets
Angular profile models and state SHALL store only the sanitized profile DTO returned by the server.

#### Scenario: Profile state is inspected
- **WHEN** profile state or models are reviewed
- **THEN** they contain no password hash, session token, CSRF hash, TOTP secret, backup code, or reset OTP fields

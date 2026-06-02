## ADDED Requirements

### Requirement: Reset request with demo OTP
The system SHALL expose a server-side reset request endpoint that accepts an email address, generates a short numeric demo OTP for eligible users, stores only a hashed OTP with expiry and attempt limits, and returns a generic response.

#### Scenario: Existing email requests reset
- **WHEN** a user submits an email address that belongs to an active account
- **THEN** the server creates a reset OTP record with a hash, expiry timestamp, attempt counter, and demo delivery metadata without storing the plaintext OTP

#### Scenario: Unknown email requests reset
- **WHEN** a user submits an email address that does not belong to an active account
- **THEN** the server returns the same generic response shape used for known emails and does not reveal whether the account exists

#### Scenario: Reset request is rate limited
- **WHEN** repeated reset requests exceed the configured rate limit for an identifier or IP address
- **THEN** the server rejects the request with a translated rate-limit error key and does not generate a new OTP

### Requirement: Reset OTP verification
The system SHALL verify reset OTP submissions server-side using the hashed OTP record, expiry timestamp, attempt count, and consumed state.

#### Scenario: OTP verification succeeds
- **WHEN** a user submits the correct OTP before expiry and within the allowed attempt count
- **THEN** the server marks the OTP as verified and returns a short-lived reset transaction reference that can be used to set a new password

#### Scenario: OTP mismatch
- **WHEN** a user submits an incorrect OTP
- **THEN** the server increments the attempt count and returns a translated OTP mismatch error key without exposing the expected code

#### Scenario: OTP expired
- **WHEN** a user submits an OTP after its expiry timestamp
- **THEN** the server rejects verification with a translated expiry error key and requires a new reset request

### Requirement: Reset password completion
The system SHALL allow password updates only after successful OTP verification and SHALL hash the new password before saving it.

#### Scenario: Reset completion succeeds
- **WHEN** a user submits a strong new password with a valid verified reset transaction
- **THEN** the server updates `User.passwordHash`, records password-change metadata, consumes reset OTP records, revokes existing sessions, and returns a sanitized success response

#### Scenario: Weak reset password
- **WHEN** a user submits a new password that fails password policy
- **THEN** the server rejects the request with field-level translated validation error keys and does not change the stored password hash

#### Scenario: Reused reset transaction
- **WHEN** a user attempts to complete reset with a consumed or invalid reset transaction
- **THEN** the server rejects the request and does not update the password

### Requirement: Reset flow auditability
The system SHALL preserve enough server-side reset metadata to test and audit expiry, attempts, consumed state, and password-change outcomes without exposing secret values.

#### Scenario: Reset record inspection
- **WHEN** reset records are inspected in the database
- **THEN** they contain hashed OTP values and lifecycle metadata but no plaintext OTPs or passwords

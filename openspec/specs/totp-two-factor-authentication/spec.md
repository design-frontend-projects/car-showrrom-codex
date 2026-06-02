# totp-two-factor-authentication Specification

## Purpose
Define the TOTP 2FA contract for setup, login challenge, backup codes, disable flow, and required-2FA policy handling.

## Requirements
### Requirement: TOTP setup and QR generation
The system SHALL provide a server-side 2FA setup flow that generates an RFC6238-compatible TOTP secret, stores the secret encrypted at rest, and returns QR setup data without enabling 2FA until verification succeeds.

#### Scenario: User starts 2FA setup
- **WHEN** an authenticated user requests 2FA setup
- **THEN** the server creates or replaces a pending encrypted TOTP secret and returns an otpauth URI or QR image data for the current account

#### Scenario: Setup QR is generated server-side
- **WHEN** the 2FA setup response is created
- **THEN** QR or otpauth setup data is derived on the server and no raw unencrypted TOTP secret is persisted

#### Scenario: Setup verification succeeds
- **WHEN** the user submits a valid TOTP code for the pending secret
- **THEN** the server enables 2FA, records verification metadata, generates backup codes, and returns each backup code only once

### Requirement: 2FA login challenge
The system SHALL require a valid TOTP code or backup code before completing login for users with enabled or required 2FA.

#### Scenario: TOTP challenge succeeds
- **WHEN** a pending-login user submits a valid current TOTP code
- **THEN** the server completes authentication, rotates the session identifier, sets the secure session cookie, and returns a sanitized auth session DTO

#### Scenario: TOTP challenge fails
- **WHEN** a pending-login user submits an invalid TOTP code
- **THEN** the server rejects the challenge, increments applicable attempt controls, and does not create a full authenticated session

#### Scenario: 2FA challenge expires
- **WHEN** a pending-login challenge expires before verification
- **THEN** the server rejects further verification attempts and requires the user to restart login

### Requirement: Backup codes
The system SHALL generate one-time backup codes for 2FA recovery and store only hashed backup code values.

#### Scenario: Backup code is used
- **WHEN** a pending-login user submits a valid unused backup code
- **THEN** the server consumes that backup code, completes authentication, and prevents the same backup code from being used again

#### Scenario: Backup codes are regenerated
- **WHEN** an authenticated user regenerates backup codes after satisfying password and 2FA verification
- **THEN** the server invalidates previous unused backup codes and returns the newly generated backup codes only once

### Requirement: 2FA disable flow
The system SHALL require password confirmation and a valid current TOTP or backup code before disabling 2FA for an account.

#### Scenario: Disable 2FA succeeds
- **WHEN** an authenticated user submits the correct password and a valid TOTP or backup code
- **THEN** the server disables 2FA, clears encrypted TOTP secret material, clears backup codes, and records the change

#### Scenario: Disable 2FA verification fails
- **WHEN** an authenticated user submits an incorrect password, invalid TOTP, or invalid backup code
- **THEN** the server rejects the request and leaves 2FA enabled

### Requirement: Required 2FA policy
The system SHALL represent whether 2FA is required separately from whether a user has completed 2FA enrollment.

#### Scenario: Required 2FA user without enrollment
- **WHEN** a user subject to required 2FA logs in before enrollment is complete
- **THEN** the server returns a challenge state that allows setup/verification but does not grant a full authenticated session until enrollment succeeds

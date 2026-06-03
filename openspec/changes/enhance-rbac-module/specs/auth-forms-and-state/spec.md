## ADDED Requirements

### Requirement: Invited-user password setup form
The system SHALL provide an invited-user password setup form using the existing auth form and validation patterns.

#### Scenario: Onboarding form validates invited user input
- **WHEN** an invited user edits the onboarding form
- **THEN** the signal-form schema exposes translated validation states for required display name, optional phone format when provided, password policy, and password confirmation

#### Scenario: Invited email is fixed
- **WHEN** the onboarding form is rendered from a valid invitation
- **THEN** the invited email is shown as the identity being onboarded and cannot be edited into a different email address

#### Scenario: Onboarding form submits valid payload
- **WHEN** the invited user submits valid onboarding input
- **THEN** Angular sends only the expected invitation token or onboarding challenge, display name, optional phone, and password fields to the same-origin onboarding API

### Requirement: Invited-user onboarding route state
The system SHALL protect invited-user onboarding route state without treating the invited user as fully authenticated.

#### Scenario: Valid invitation route opens setup
- **WHEN** a user opens an onboarding route with a valid invitation token or challenge
- **THEN** the route renders the password setup screen and keeps protected client/admin routes unavailable

#### Scenario: Invalid invitation route shows safe recovery
- **WHEN** a user opens an onboarding route with an invalid, expired, accepted, or revoked invitation
- **THEN** the route shows a localized safe recovery state with a login action and no tenant or secret details

#### Scenario: Onboarding completion returns to login
- **WHEN** the onboarding API accepts the invitation
- **THEN** the auth UI clears onboarding state and navigates to the login screen with a localized success state

### Requirement: Invited-user login entry point
The system SHALL give invited first-time users a clear path from login to onboarding.

#### Scenario: Login detects onboarding requirement
- **WHEN** the auth API reports that an invited identity requires onboarding
- **THEN** the login UI transitions to the invited-user onboarding route or prompt without displaying a generic failure as the primary outcome

#### Scenario: Normal login errors remain generic
- **WHEN** the auth API rejects credentials for a non-invited or ineligible identity
- **THEN** the login UI displays the existing generic localized authentication error

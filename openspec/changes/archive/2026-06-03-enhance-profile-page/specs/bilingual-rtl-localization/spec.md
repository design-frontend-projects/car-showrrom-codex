## ADDED Requirements

### Requirement: Profile translation parity
The system SHALL include English and Arabic translation keys for all profile labels, sections, actions, statuses, fallback values, loading states, and error states.

#### Scenario: Profile translation keys compared
- **WHEN** translation key parity tests inspect `public/i18n/en.json` and `public/i18n/ar.json`
- **THEN** every profile key exists in both files

### Requirement: Localized profile status text
Profile account status, 2FA status, role labels when mapped, missing-field fallbacks, and API errors SHALL render as localized text.

#### Scenario: Missing phone in Arabic
- **WHEN** Arabic is active and the current user has no phone number
- **THEN** the profile page displays the Arabic fallback value for missing phone

### Requirement: RTL-safe profile presentation
The profile page SHALL render identity, contact, security, tenant, and timeline sections coherently when Arabic and RTL direction are active.

#### Scenario: Arabic profile layout
- **WHEN** Arabic is active at a narrow viewport
- **THEN** profile text, icons, metadata rows, and action controls fit without horizontal overflow or incoherent overlap

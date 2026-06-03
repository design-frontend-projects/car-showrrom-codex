## ADDED Requirements

### Requirement: Invitation management translation parity
The system SHALL include English and Arabic translation keys for invited-user management labels, fields, actions, statuses, empty states, loading states, validation messages, dialogs, and errors.

#### Scenario: Invitation management keys compared
- **WHEN** translation key parity tests inspect `public/i18n/en.json` and `public/i18n/ar.json`
- **THEN** every invited-user management key exists in both files

#### Scenario: Arabic invited users screen renders
- **WHEN** Arabic is active and an admin opens the invited-users workspace
- **THEN** invitation fields, statuses, timestamps, actions, dialogs, errors, and empty states render in Arabic instead of raw keys or English fallback text

### Requirement: Onboarding translation parity
The system SHALL include English and Arabic translation keys for invited-user onboarding labels, guidance, validation messages, success states, expired/invalid invitation states, and login redirection messages.

#### Scenario: Onboarding keys compared
- **WHEN** translation key parity tests inspect onboarding-related keys in `public/i18n/en.json` and `public/i18n/ar.json`
- **THEN** both files contain matching key paths for invited-user onboarding

#### Scenario: Arabic onboarding errors render
- **WHEN** Arabic is active and the server returns an onboarding validation or invitation-state error key
- **THEN** the onboarding screen displays the Arabic message instead of the raw key or English fallback text

### Requirement: RTL-safe invitation and onboarding layouts
The system SHALL render invited-user management and invited-user onboarding coherently in right-to-left layout.

#### Scenario: Arabic invited users mobile layout
- **WHEN** Arabic is active at a narrow viewport and an admin opens invited-user management
- **THEN** tables or responsive list rows, status chips, role labels, timestamp fields, and action buttons fit without horizontal overflow or incoherent overlap

#### Scenario: Arabic onboarding form layout
- **WHEN** Arabic is active at a narrow viewport and an invited user opens password setup
- **THEN** form labels, inputs, validation text, password controls, actions, and success/error states follow RTL direction and remain readable without overlapping

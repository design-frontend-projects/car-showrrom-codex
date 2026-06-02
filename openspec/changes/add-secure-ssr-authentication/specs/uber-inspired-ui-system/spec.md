## ADDED Requirements

### Requirement: Auth UI follows visual foundation
The system SHALL style auth screens, dialogs, topbar account controls, validation states, OTP inputs, QR setup views, and backup code displays using the existing visual foundation.

#### Scenario: Auth form visual consistency
- **WHEN** registration, login, reset, or 2FA forms render
- **THEN** typography, spacing, inputs, buttons, focus states, error states, and disabled/loading states match the shared app design system

#### Scenario: Account menu visual consistency
- **WHEN** an authenticated user opens the topbar account menu
- **THEN** avatar, menu items, signout actions, hover states, and focus states match the shell visual language

### Requirement: Auth controls remain accessible
The system SHALL keep auth controls keyboard-accessible, screen-reader labeled, and visibly focused.

#### Scenario: Keyboard auth flow
- **WHEN** a keyboard user completes login, reset, or 2FA verification
- **THEN** focus order is logical, focus indicators are visible, form errors are announced or associated with fields, and submit/loading states remain clear

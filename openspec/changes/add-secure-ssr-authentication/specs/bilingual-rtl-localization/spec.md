## ADDED Requirements

### Requirement: Auth validation translation parity
The system SHALL provide English and Arabic translation keys for all auth form labels, validation messages, server error messages, 2FA messages, reset messages, and signout/account menu labels.

#### Scenario: Auth translation key parity
- **WHEN** auth-related key paths in `public/i18n/en.json` and `public/i18n/ar.json` are compared
- **THEN** both files contain the same key paths for auth UI, validation, server errors, reset, 2FA, and account menu text

#### Scenario: Server validation error is translated
- **WHEN** the server returns an auth validation error key while Arabic is active
- **THEN** the user sees the Arabic translation instead of the raw key or English fallback

### Requirement: Auth forms support RTL layout
The system SHALL render auth forms, OTP inputs, QR setup views, backup codes, and account menus correctly in both LTR and RTL directions.

#### Scenario: Arabic auth form on mobile
- **WHEN** Arabic is active on a narrow viewport and a user opens an auth form
- **THEN** labels, inputs, validation text, buttons, icons, and OTP fields fit without horizontal scrolling or incoherent overlap

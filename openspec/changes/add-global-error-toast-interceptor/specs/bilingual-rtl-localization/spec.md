## ADDED Requirements

### Requirement: Backend error translation keys
The system SHALL resolve backend error messages marked with a `transKey` flag through the active local i18n JSON files before displaying them to the user.

#### Scenario: English translated backend error
- **WHEN** English is active and a backend error payload contains `transKey` with a translation key
- **THEN** the global error toast displays the English value from `public/i18n/en.json`

#### Scenario: Arabic translated backend error
- **WHEN** Arabic is active and a backend error payload contains `transKey` with a translation key
- **THEN** the global error toast displays the Arabic value from `public/i18n/ar.json`

#### Scenario: Translation key is missing
- **WHEN** a backend error payload contains `transKey` with a key that is not present in the active translation file
- **THEN** the global error toast displays a safe fallback message instead of an untranslated key

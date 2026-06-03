## ADDED Requirements

### Requirement: Color definition translation parity
The system SHALL include English and Arabic translation keys for all exterior and interior color definition screens, fields, actions, states, validation messages, dropdown labels, toasts, and accessibility announcements.

#### Scenario: Color translation keys compared
- **WHEN** translation key parity tests inspect `public/i18n/en.json` and `public/i18n/ar.json`
- **THEN** every color definition and vehicle editor color selector key exists in both files

#### Scenario: Arabic color definition UI
- **WHEN** Arabic is active and an admin opens an exterior or interior color definition screen
- **THEN** the screen renders Arabic labels, actions, validation messages, empty states, and announcements instead of raw keys or English fallback text

### Requirement: RTL-safe color controls
The system SHALL render color definition screens and vehicle editor color dropdowns coherently in right-to-left layouts.

#### Scenario: Arabic color definition layout
- **WHEN** Arabic language and RTL direction are active at a narrow viewport
- **THEN** color tables, search controls, swatches, dialogs, form fields, and action buttons fit without horizontal overflow or incoherent overlap

#### Scenario: Arabic vehicle color dropdowns
- **WHEN** Arabic language and RTL direction are active in the vehicle editor
- **THEN** exterior and interior color dropdown labels, swatches, selected values, clear controls, and validation text remain aligned and readable

### Requirement: Localized dynamic color names
The system SHALL display localized color catalog names when a matching localized name exists and fall back to the canonical color name otherwise.

#### Scenario: Localized color name exists
- **WHEN** Arabic is active and a selected color has an Arabic localized name
- **THEN** the vehicle editor and definition preview display the Arabic localized color name

#### Scenario: Localized color name missing
- **WHEN** Arabic is active and a selected color does not have an Arabic localized name
- **THEN** the vehicle editor and listing metadata display the canonical color name instead of a raw missing value

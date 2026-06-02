## ADDED Requirements

### Requirement: Showroom translation parity
All showroom search, details, listing management, upload, request review, status, and validation copy SHALL have matching English and Arabic translation keys.

#### Scenario: Translation key parity
- **WHEN** the translation parity test runs
- **THEN** every showroom key present in `public/i18n/en.json` is present in `public/i18n/ar.json` and vice versa

### Requirement: Localized validation and status labels
Server and client validation errors for showroom workflows SHALL resolve to localized user-facing messages.

#### Scenario: Listing limit message
- **WHEN** a client exceeds the five-active-listing limit while Arabic is active
- **THEN** the UI displays the Arabic listing-limit validation message

### Requirement: RTL showroom layouts
Showroom forms, filters, cards, tables, galleries, and review controls SHALL render coherently in right-to-left layout when Arabic is active.

#### Scenario: Arabic catalog filters
- **WHEN** Arabic language and RTL direction are active
- **THEN** advanced search filters, buttons, and result cards align and order correctly without overlapping content

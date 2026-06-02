# bilingual-rtl-localization Specification

## Purpose
Define the English/Arabic localization and RTL rendering contract for the Angular SSR app.
## Requirements
### Requirement: Language control
The system SHALL provide a navbar language control that lets users switch between English and Arabic.

#### Scenario: User selects Arabic
- **WHEN** a user selects Arabic from the navbar language control
- **THEN** visible translated UI text switches to Arabic and the selected language is recorded as `ar`

#### Scenario: User selects English
- **WHEN** a user selects English from the navbar language control
- **THEN** visible translated UI text switches to English and the selected language is recorded as `en`

### Requirement: Language preference persistence
The system SHALL persist the selected language in browser storage and restore it on later visits.

#### Scenario: Stored language exists
- **WHEN** a returning browser user opens the app after previously selecting Arabic or English
- **THEN** the app restores that selected language without requiring user interaction

#### Scenario: Stored language is invalid
- **WHEN** stored language preference is not one of `en` or `ar`
- **THEN** the app falls back to the configured default language

### Requirement: Arabic translation parity
The system SHALL include `public/i18n/ar.json` with the same key paths as `public/i18n/en.json` and Arabic translations for every value.

#### Scenario: Translation files are compared
- **WHEN** the key paths of `en.json` and `ar.json` are inspected
- **THEN** both files contain the same key paths

#### Scenario: Arabic UI string is requested
- **WHEN** the active language is Arabic and a translated key is rendered
- **THEN** the user sees the Arabic translation instead of the English fallback or raw translation key

### Requirement: App-wide direction metadata
The system SHALL apply app-wide `lang` and `dir` metadata to the document for the selected language.

#### Scenario: English is active
- **WHEN** English is the selected language
- **THEN** the document root has `lang="en"` and `dir="ltr"`

#### Scenario: Arabic is active
- **WHEN** Arabic is the selected language
- **THEN** the document root has `lang="ar"` and `dir="rtl"`

### Requirement: RTL-safe layout
The system SHALL render the shell, navigation, cards, forms, dialogs, drawer, map picker, and workspace views correctly in RTL without horizontal overflow or incoherent overlap.

#### Scenario: Arabic mobile layout renders
- **WHEN** the app renders in Arabic at a 320px-wide viewport
- **THEN** topbar controls, drawer navigation, auth rail, hero content, forms, and cards fit without horizontal scrolling

#### Scenario: Arabic desktop layout renders
- **WHEN** the app renders in Arabic at desktop widths
- **THEN** primary navigation, right-side controls, content grids, and workspace metrics follow RTL direction while preserving readable spacing and alignment

### Requirement: Direction-aware controls
The system SHALL keep interactive controls understandable in both LTR and RTL contexts.

#### Scenario: Icon and label controls render in RTL
- **WHEN** Arabic direction is active
- **THEN** icons, text labels, chevrons, drawer placement, and action spacing remain visually coherent for RTL users

#### Scenario: Input fields render in RTL
- **WHEN** Arabic direction is active and a user focuses a form or search input
- **THEN** input text direction and placeholder alignment follow the active document direction unless a field explicitly requires otherwise

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


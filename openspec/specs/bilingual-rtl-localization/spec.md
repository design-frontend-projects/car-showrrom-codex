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

## ADDED Requirements

### Requirement: Admin definition translation parity
The system SHALL provide English and Arabic translation keys for all admin vehicle definition navigation, screen titles, form labels, table headers, actions, statuses, validation messages, dialogs, toasts, empty states, and error states.

#### Scenario: Admin definition translation keys compared
- **WHEN** translation key parity tests compare admin vehicle definition keys in `public/i18n/en.json` and `public/i18n/ar.json`
- **THEN** both files contain the same key paths

#### Scenario: Arabic admin definition screen renders
- **WHEN** Arabic is active and an admin opens a vehicle definition screen
- **THEN** all static UI text renders in Arabic instead of raw keys or English fallback text

### Requirement: Localized admin authorization states
Admin navigation, route guards, and forbidden API states SHALL render localized messages.

#### Scenario: Admin button label is localized
- **WHEN** English or Arabic is active and an authorized user sees the Admin module button
- **THEN** the button label and accessible name use the active language

#### Scenario: Forbidden route message is localized
- **WHEN** a non-admin user attempts to access an admin route while Arabic is active
- **THEN** the access-denied message and recovery action render in Arabic

### Requirement: Localized CRUD feedback and announcements
Vehicle definition CRUD success, failure, confirmation, and destructive-action messages SHALL be localized and screen-reader friendly.

#### Scenario: Delete confirmation is localized
- **WHEN** an admin opens a delete confirmation dialog
- **THEN** the dialog title, body, confirm action, cancel action, and accessible description use the active language

#### Scenario: CRUD success is announced
- **WHEN** a create, update, or delete operation succeeds
- **THEN** the visible toast and screen-reader announcement use the active language

#### Scenario: Server validation key is translated
- **WHEN** the server returns a translation key for a vehicle definition validation error
- **THEN** the global error handling displays the matching active-language message

### Requirement: RTL-safe admin definition layouts
Admin vehicle definition screens SHALL render coherently in both LTR and RTL directions without horizontal overflow or overlapping controls.

#### Scenario: Arabic mobile admin definitions
- **WHEN** Arabic is active at a narrow viewport and an admin opens a definition screen
- **THEN** search controls, tables or list rows, form dialogs, dropdowns, and action buttons fit without horizontal scrolling

#### Scenario: Arabic desktop admin definitions
- **WHEN** Arabic is active at desktop width and an admin opens the definitions dashboard
- **THEN** navigation, filters, data tables, dialogs, and metadata follow RTL direction while preserving readable spacing and focus order

### Requirement: Localized dynamic catalog labels
Vehicle definition APIs and UI SHALL support localized catalog labels where applicable while preserving stable identifiers and normalized search fields.

#### Scenario: Localized catalog label exists
- **WHEN** a vehicle definition record has a label for the active locale
- **THEN** dropdowns and tables display that localized label

#### Scenario: Localized catalog label is missing
- **WHEN** a vehicle definition record does not have a label for the active locale
- **THEN** the UI displays a safe fallback label without exposing an untranslated key

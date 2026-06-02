# appearance-mode-switching Specification

## Purpose
Define the user-facing theme mode contract for switching between light, dark, and system appearance modes across the Angular SSR app.

## Requirements
### Requirement: Theme mode control
The system SHALL provide a navbar control that lets users select `light`, `dark`, or `system` theme mode.

#### Scenario: User selects light mode
- **WHEN** a user selects light mode from the navbar theme control
- **THEN** the app applies the light theme and records `light` as the selected theme mode

#### Scenario: User selects dark mode
- **WHEN** a user selects dark mode from the navbar theme control
- **THEN** the app applies the dark theme and records `dark` as the selected theme mode

#### Scenario: User selects system mode
- **WHEN** a user selects system mode from the navbar theme control
- **THEN** the app uses the current system color-scheme preference as the effective theme and records `system` as the selected theme mode

### Requirement: Theme preference persistence
The system SHALL persist the selected theme mode in browser storage and restore it on later visits.

#### Scenario: Stored theme mode exists
- **WHEN** a returning browser user opens the app after previously selecting a theme mode
- **THEN** the app restores that selected theme mode without requiring user interaction

#### Scenario: Storage is unavailable
- **WHEN** browser storage is unavailable or the app is rendering on the server
- **THEN** the app uses a deterministic fallback theme mode without crashing

### Requirement: Effective dark theme application
The system SHALL apply effective dark mode to the whole app through the configured PrimeNG dark mode selector and app-level theme attributes.

#### Scenario: Effective theme is dark
- **WHEN** the effective theme resolves to dark
- **THEN** the document root has the `.app-dark` class and app styles render dark surfaces, text, borders, overlays, and controls

#### Scenario: Effective theme is light
- **WHEN** the effective theme resolves to light
- **THEN** the document root does not have the `.app-dark` class and app styles render light surfaces, text, borders, overlays, and controls

### Requirement: System theme reactivity
The system SHALL react to operating-system color-scheme changes while the selected mode is `system`.

#### Scenario: System changes to dark
- **WHEN** selected theme mode is `system` and the OS preference changes to dark
- **THEN** the app updates the effective theme to dark without changing the selected theme mode

#### Scenario: System changes to light
- **WHEN** selected theme mode is `system` and the OS preference changes to light
- **THEN** the app updates the effective theme to light without changing the selected theme mode

### Requirement: Theme controls are accessible and responsive
The system SHALL expose theme controls that are keyboard-accessible, screen-reader labeled, and usable on mobile, tablet, and desktop widths.

#### Scenario: Keyboard user changes theme
- **WHEN** a keyboard user focuses the theme mode control and changes the selection
- **THEN** the selected mode changes and focus remains visible throughout the interaction

#### Scenario: Mobile user changes theme
- **WHEN** a mobile user opens the app shell
- **THEN** the theme mode control remains reachable without causing horizontal overflow

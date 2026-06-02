## ADDED Requirements

### Requirement: Responsive authenticated account presentation
The system SHALL use responsive layout signals to choose desktop and mobile authenticated account presentations in the shell.

#### Scenario: Desktop authenticated shell
- **WHEN** the responsive helper reports desktop layout and the user is authenticated
- **THEN** the shell presents topbar account controls with desktop-appropriate density and without opening the mobile drawer

#### Scenario: Mobile authenticated shell
- **WHEN** the responsive helper reports mobile layout and the user is authenticated
- **THEN** the shell presents account controls through compact topbar or drawer interactions without horizontal overflow

### Requirement: Responsive auth forms
The system SHALL keep registration, login, reset, and 2FA flows usable across mobile, tablet, and desktop viewports.

#### Scenario: Narrow auth flow
- **WHEN** an auth flow renders at a 320px-wide viewport
- **THEN** inputs, QR setup content, backup codes, validation messages, and action buttons fit within the viewport and remain operable

# uber-inspired-ui-system Specification

## Purpose
TBD - created by archiving change change-app-ui-ux. Update Purpose after archive.
## Requirements
### Requirement: Uber-inspired visual foundation
The system SHALL provide a cohesive Uber-inspired visual foundation for the Angular showroom UI using a black/white-first palette, restrained gray surfaces, bold typography, compact spacing, and measured accent usage.

#### Scenario: Global tokens define the visual language
- **WHEN** a developer inspects the global styling entry point
- **THEN** it defines reusable tokens for ink, surfaces, lines, muted text, accent, radius, shadow, spacing, and content width that match the showroom visual direction

#### Scenario: PrimeNG controls follow the system
- **WHEN** PrimeNG buttons, inputs, cards, dialogs, drawers, menus, or avatars render in the app
- **THEN** their visible styling follows the shared visual foundation instead of appearing as unrelated default components

### Requirement: Mobile-first page composition
The system SHALL compose visible pages with mobile-first spacing, margins, and layout behavior before progressively enhancing tablet and desktop views.

#### Scenario: Narrow viewport remains usable
- **WHEN** the app renders at a 320px-wide viewport
- **THEN** navigation, hero content, search controls, cards, forms, dialogs, and workspace metrics fit without horizontal scrolling or overlapping text

#### Scenario: Wide viewport gains density
- **WHEN** the app renders at desktop widths
- **THEN** content uses wider grids, persistent navigation, and balanced page margins without stretching readable content beyond the configured maximum width

### Requirement: Showroom shell visual refresh
The system SHALL refresh the application shell so brand, navigation, auth rail, drawer, and route content share the same spacing and visual hierarchy.

#### Scenario: Desktop shell uses persistent navigation
- **WHEN** a desktop user visits the app shell
- **THEN** the primary navigation and relevant account or admin actions are visible without opening the mobile drawer

#### Scenario: Mobile shell uses compact navigation
- **WHEN** a mobile user visits the app shell
- **THEN** the shell presents compact navigation with touch-friendly controls and does not reserve desktop-only rail space

### Requirement: Showroom content refresh
The system SHALL refresh landing, catalog, content/contact, admin, client, and shared component views so their cards, sections, forms, and metrics follow the shared design system.

#### Scenario: Landing and catalog content share design rhythm
- **WHEN** a user moves between the landing page and catalog pages
- **THEN** hero, search, quick actions, vehicle cards, and detail actions use consistent spacing, typography, and action styling

#### Scenario: Workspace pages share design rhythm
- **WHEN** a user visits admin or client workspace pages
- **THEN** page headers and metric cards use the same responsive spacing, surface, and type scale as the rest of the app

### Requirement: Accessible interaction states
The system SHALL preserve accessible focus, hover, active, and disabled states for refreshed controls and navigational elements.

#### Scenario: Keyboard navigation remains visible
- **WHEN** a keyboard user tabs through links, buttons, inputs, drawer controls, and dialog controls
- **THEN** each focused element has a visible focus state with sufficient contrast

#### Scenario: Disabled and loading controls remain clear
- **WHEN** a control is disabled or not actionable
- **THEN** the visual state communicates reduced availability without losing label readability
### Requirement: Polished profile composition
The profile page SHALL follow the existing visual system with restrained surfaces, clear hierarchy, readable metadata, accessible contrast, and professional account-dashboard styling.

#### Scenario: Profile summary renders
- **WHEN** profile data is available
- **THEN** the summary area presents avatar or initials, display name, email, account status, and primary navigation actions without clipped text

### Requirement: Profile interaction states
The profile page SHALL provide accessible hover, focus, loading, disabled, empty, and error states for profile actions and content sections.

#### Scenario: Keyboard navigation through profile actions
- **WHEN** a keyboard user tabs through profile page actions and links
- **THEN** each focused element has a visible focus state with sufficient contrast

### Requirement: Account metadata readability
The profile page SHALL present contact, security, tenant, role, and timeline data in compact sections that can be scanned quickly.

#### Scenario: Metadata section renders
- **WHEN** the profile page displays account metadata
- **THEN** labels, values, icons, and status chips remain visually distinct and do not overlap at supported breakpoints

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

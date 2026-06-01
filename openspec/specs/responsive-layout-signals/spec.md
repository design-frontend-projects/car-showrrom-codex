# responsive-layout-signals Specification

## Purpose
TBD - created by archiving change change-app-ui-ux. Update Purpose after archive.
## Requirements
### Requirement: Signal-based responsive helper
The system SHALL provide a reusable Angular responsive helper built on `@angular/cdk/layout` `BreakpointObserver` and Angular signals.

#### Scenario: Components read viewport state as signals
- **WHEN** an Angular component needs responsive state
- **THEN** it can inject the helper and read signal values for mobile, tablet, desktop, and layout mode without manually subscribing to observables

#### Scenario: Helper uses CDK breakpoint observation
- **WHEN** viewport width crosses a configured breakpoint
- **THEN** the helper updates its signal state through Angular CDK Layout observation

### Requirement: Responsive state is SSR-safe
The system SHALL keep responsive state compatible with Angular SSR and hydration.

#### Scenario: Server render has deterministic fallback
- **WHEN** the app renders on the server before browser viewport APIs are available
- **THEN** responsive signals expose a deterministic fallback state that does not crash SSR

#### Scenario: Browser hydration updates viewport state
- **WHEN** the app hydrates in the browser
- **THEN** responsive signals update to reflect the actual viewport observed by Angular CDK

### Requirement: Shell consumes responsive signals
The system SHALL use responsive signals to drive shell behavior such as mobile navigation, drawer visibility decisions, compact auth presentation, and desktop navigation density.

#### Scenario: Mobile state selects drawer navigation
- **WHEN** the responsive helper reports a mobile layout
- **THEN** the app shell uses mobile drawer navigation and compact account or auth presentation

#### Scenario: Desktop state selects persistent navigation
- **WHEN** the responsive helper reports a desktop layout
- **THEN** the app shell uses persistent navigation and desktop-appropriate account or auth presentation

### Requirement: Feature views consume responsive signals where CSS alone is insufficient
The system SHALL use responsive signals and computed values for feature-level layout decisions that require TypeScript state, while leaving pure visual wrapping to CSS media queries.

#### Scenario: Grid density is computed from responsive state
- **WHEN** a feature component needs to choose compact, medium, or full layout density
- **THEN** it derives that decision from the responsive helper using signals or computed values

#### Scenario: CSS remains responsible for simple wrapping
- **WHEN** an element only needs visual wrapping or spacing changes
- **THEN** the implementation uses mobile-first CSS rather than duplicating the behavior in TypeScript

### Requirement: Responsive helper is testable
The system SHALL include focused tests or verifiable behavior for the responsive helper and any shell behavior that depends on it.

#### Scenario: Breakpoint changes update exposed state
- **WHEN** observed breakpoint matches change in tests or controlled verification
- **THEN** the helper exposes the expected mobile, tablet, desktop, and layout mode values

#### Scenario: Shell behavior follows helper state
- **WHEN** shell responsive state changes
- **THEN** the shell presents the corresponding mobile or desktop navigation behavior


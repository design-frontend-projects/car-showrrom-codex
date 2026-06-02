## ADDED Requirements

### Requirement: Responsive profile layout
The profile page SHALL adapt its summary header, profile cards, metadata grids, and action controls for mobile, tablet, and desktop layouts.

#### Scenario: Mobile profile layout
- **WHEN** the profile page renders on a mobile viewport
- **THEN** identity summary, contact details, security status, tenant information, and timeline metadata stack cleanly without horizontal scrolling

#### Scenario: Desktop profile layout
- **WHEN** the profile page renders on a desktop viewport
- **THEN** the page uses a scan-friendly multi-column composition while preserving readable content width

### Requirement: Profile density uses existing responsive patterns
The profile implementation SHALL use existing responsive layout signals for TypeScript-driven density decisions and CSS for simple wrapping.

#### Scenario: Profile density changes by breakpoint
- **WHEN** the responsive helper reports mobile, tablet, or desktop state
- **THEN** the profile page applies the corresponding compact, medium, or full density behavior where TypeScript state is needed

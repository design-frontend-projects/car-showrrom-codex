## ADDED Requirements

### Requirement: Responsive showroom discovery
The public landing search, advanced filters, results, and details views SHALL adapt to mobile, tablet, and desktop breakpoints using the existing responsive layout signals.

#### Scenario: Mobile catalog search
- **WHEN** a public user opens catalog search on a mobile viewport
- **THEN** filters, result cards, and actions are usable without horizontal scrolling or overlapping text

#### Scenario: Desktop catalog search
- **WHEN** a public user opens catalog search on a desktop viewport
- **THEN** filters and results use a scan-friendly layout with persistent access to primary search controls

### Requirement: Responsive listing workflows
Client listing forms, image upload, listing dashboard, and admin review screens SHALL provide compact and full layouts appropriate to the active breakpoint.

#### Scenario: Mobile listing form
- **WHEN** a client creates or edits a listing on a mobile viewport
- **THEN** form sections, validation messages, and submit actions remain visible and reachable without layout collisions

### Requirement: Responsive gallery
The listing image gallery SHALL size media predictably across breakpoints and preserve usable navigation controls.

#### Scenario: Details gallery on mobile
- **WHEN** a public user views listing details on a mobile viewport
- **THEN** the gallery displays images with stable aspect ratio and accessible next/previous controls

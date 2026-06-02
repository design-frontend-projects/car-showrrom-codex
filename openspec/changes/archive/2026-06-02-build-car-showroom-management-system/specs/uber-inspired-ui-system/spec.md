## ADDED Requirements

### Requirement: Professional catalog presentation
Showroom catalog cards, details pages, dashboards, and review queues SHALL follow the existing visual system with restrained typography, clear hierarchy, accessible contrast, and dense but readable information.

#### Scenario: Result card content
- **WHEN** a catalog result card renders
- **THEN** it presents image, price, make/model/variant, year, mileage, status, and "More Details" action without clipping text across supported breakpoints

### Requirement: Showroom interaction states
Showroom pages SHALL include polished loading, empty, error, disabled, hover, focus, and validation states using existing PrimeNG and app styling patterns.

#### Scenario: Upload validation state
- **WHEN** an image upload fails validation
- **THEN** the UI shows a localized error state near the upload control without disrupting the rest of the form

### Requirement: Page transitions
Showroom route changes SHALL use professional Angular animations aligned with existing route animation metadata.

#### Scenario: Search to details transition
- **WHEN** a user opens "More Details" from search results
- **THEN** the app transitions to the details view smoothly while preserving accessible focus behavior

### Requirement: Gallery visual quality
The image gallery SHALL use PrimeNG Carousel or an equivalent high-quality component with thumbnails or preview controls suitable for inspecting vehicle photos.

#### Scenario: Listing with multiple photos
- **WHEN** a listing has several photos
- **THEN** the gallery offers clear image navigation and keeps vehicle photos visible without decorative framing that hides important content

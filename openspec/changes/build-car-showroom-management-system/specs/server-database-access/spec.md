## ADDED Requirements

### Requirement: Showroom Prisma boundary
Showroom data access SHALL remain server-only under `src/server/**`, and Angular browser code MUST consume showroom data through HTTP DTOs.

#### Scenario: Browser bundle uses API DTOs
- **WHEN** an Angular component displays catalog, listing, image, or request data
- **THEN** it imports only Angular-safe services/models and does not import Prisma, `pg`, or server repository modules

### Requirement: Transactional listing mutations
Listing mutations that change price, model metadata, images, status, or ownership-sensitive fields SHALL use server-side transactions where related history or invariant updates are required.

#### Scenario: Price update transaction
- **WHEN** a listing price update succeeds
- **THEN** both the listing row and its price history row are committed together

#### Scenario: History write failure
- **WHEN** the history row for a price or model update cannot be written
- **THEN** the listing change MUST roll back

### Requirement: Upload storage configuration
The server SHALL read upload storage configuration from environment-backed server config and MUST NOT expose raw filesystem paths to Angular.

#### Scenario: Listing media URL mapping
- **WHEN** a listing image is returned to Angular
- **THEN** the DTO contains a safe media URL and image metadata rather than the local storage root path

## ADDED Requirements

### Requirement: Tenant-scoped showroom ownership
Showroom listings, listing images, and vehicle requests SHALL be scoped to a tenant and related to users through tenant-aware foreign keys.

#### Scenario: Cross-tenant listing relationship rejected
- **WHEN** a listing, image, or request references a user or parent record from another tenant
- **THEN** the database MUST reject or the server MUST block the operation before persistence

### Requirement: Showroom permissions
The system SHALL define RBAC actions for public read access, client listing management, image upload, vehicle request submission, and administrative request review.

#### Scenario: Admin review permission
- **WHEN** a user without the administrative request-review permission calls a review endpoint
- **THEN** the system MUST reject the request even if the user is authenticated

### Requirement: Listing owner authorization
Client listing mutations SHALL require either listing ownership or an administrative permission within the same tenant.

#### Scenario: Owner mutates listing
- **WHEN** a client updates a listing they own within their tenant
- **THEN** the system allows the mutation after validation succeeds

#### Scenario: Non-owner mutation blocked
- **WHEN** a client updates a listing owned by another user in the same tenant
- **THEN** the system MUST reject the mutation unless the client has an administrative permission

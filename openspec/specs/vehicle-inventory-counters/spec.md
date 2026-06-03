# vehicle-inventory-counters Specification

## Purpose
TBD - created by archiving change admin-car-definition-screens. Update Purpose after archive.
## Requirements
### Requirement: Active new and used inventory counters
The system SHALL provide tenant-scoped counters for active new and used car listings.

#### Scenario: Fetch inventory counters
- **WHEN** the landing page requests inventory counters for a tenant
- **THEN** the server returns totals for active listings with `NEW` condition and active listings with `USED` or `CERTIFIED_PRE_OWNED` conditions

#### Scenario: Non-public listings excluded
- **WHEN** listings are draft, pending review, inactive, rejected, sold, archived, or deleted
- **THEN** those listings MUST NOT be included in public new or used counters

### Requirement: Counter cache invalidation
The system SHALL cache vehicle inventory counters and invalidate the cache after listing mutations that can change the totals.

#### Scenario: Counter invalidated after publish
- **WHEN** an administrator creates a published listing or publishes an existing listing
- **THEN** the system invalidates the tenant's counter cache before the next counter response is served

#### Scenario: Counter invalidated after condition or status change
- **WHEN** an administrator changes a listing condition or moves a listing out of active public status
- **THEN** the system invalidates the tenant's counter cache before the next counter response is served

#### Scenario: Counter response served from cache
- **WHEN** no relevant listing mutation has occurred and the counter cache entry remains fresh
- **THEN** the system may return counters from the cache instead of querying PostgreSQL again

### Requirement: Landing page counter display
The landing page SHALL display real-time new and used inventory counters with loading and fallback behavior.

#### Scenario: Landing page displays counters
- **WHEN** public counter data is available
- **THEN** the landing page displays total new cars and total used cars near the showroom category entry points

#### Scenario: Counter request fails
- **WHEN** the counter API request fails
- **THEN** the landing page remains usable and displays a non-blocking fallback state rather than stale or misleading totals

#### Scenario: Counter refresh after admin mutation
- **WHEN** an admin-created listing changes the active new or used totals
- **THEN** the landing page counter data updates on the next polling interval or explicit refresh without requiring a full application rebuild


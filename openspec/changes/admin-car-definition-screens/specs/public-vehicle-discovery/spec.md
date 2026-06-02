## ADDED Requirements

### Requirement: Landing inventory counters
The public landing page SHALL show current active new and used vehicle totals from the showroom listing database.

#### Scenario: Display active inventory totals
- **WHEN** a public user opens the landing page
- **THEN** the page displays total new cars and total used cars based on active persisted listings for the current tenant

#### Scenario: Totals align with public listing visibility
- **WHEN** a listing is not visible in public active search
- **THEN** the landing page counters MUST exclude it from new and used totals

#### Scenario: Admin publish reflected publicly
- **WHEN** an administrator publishes a new or used listing
- **THEN** the public landing counters reflect the changed totals after the configured refresh or cache invalidation path

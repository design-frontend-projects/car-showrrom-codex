## ADDED Requirements

### Requirement: Server-only resolver data access
Route resolver and option data SHALL be loaded through Express showroom APIs backed by server-only Prisma code.

#### Scenario: Angular resolver loads via HTTP
- **WHEN** an Angular route resolver needs vehicle listings, listing detail, counters, or option data
- **THEN** it calls Angular-safe HTTP services and MUST NOT import Prisma Client, `@prisma/adapter-pg`, `pg`, or server repository modules

#### Scenario: Server resolves option data
- **WHEN** an option endpoint reads vehicle definitions
- **THEN** the Prisma query executes under `src/server/**` with tenant isolation and returns DTOs that exclude database-only internals

### Requirement: Server-side definition query processing
The server SHALL process Define Vehicle Data search, filter, sort, range, and pagination parameters through validated query DTOs and Prisma queries.

#### Scenario: Validate definition query
- **WHEN** a definition endpoint receives search, filter, sort, range, page, or page-size parameters
- **THEN** the server validates the parameters before executing a Prisma query

#### Scenario: Return paginated definition result
- **WHEN** a definition endpoint returns filtered records
- **THEN** it returns `items`, `page`, `pageSize`, `total`, and `pageCount` calculated from server-side Prisma results

### Requirement: Optimized listing and option queries
The server SHALL use bounded includes, stable ordering, pagination, and indexed filters for listing and option endpoints.

#### Scenario: Query route-scoped listings
- **WHEN** the server handles a Used Cars or New Cars listing request
- **THEN** it applies tenant, active visibility, inventory scope, filters, ordering, skip, and take in Prisma before returning results

#### Scenario: Query dropdown options
- **WHEN** the server handles a dropdown option request
- **THEN** it applies tenant, active-state, search, dependency, selected-id inclusion, ordering, and result limits in Prisma before returning options

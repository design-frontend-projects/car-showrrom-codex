# server-database-access Specification

## Purpose
Define the server-side database access contract for the Angular SSR app using Prisma 7, PostgreSQL, and the PostgreSQL driver adapter.
## Requirements
### Requirement: Local PostgreSQL configuration
The system SHALL define Prisma configuration for a local PostgreSQL database reachable at `localhost:5432`, using database `postgres` and schema `showroom`.

#### Scenario: Local connection string is documented
- **WHEN** a developer inspects the database environment example
- **THEN** it includes a `DATABASE_URL` value targeting `localhost:5432`, database `postgres`, and schema `showroom`

#### Scenario: Prisma CLI uses the configured database URL
- **WHEN** a developer runs Prisma validation or migration commands
- **THEN** Prisma uses the configured `DATABASE_URL` instead of a hardcoded datasource URL in application code

### Requirement: Prisma 7 client generation
The system SHALL configure Prisma 7 client generation with an explicit generated client output path that can be imported by server-side TypeScript code.

#### Scenario: Client generation succeeds
- **WHEN** a developer runs the Prisma generation script
- **THEN** the generated Prisma client is written to the configured output path without requiring manual file edits

#### Scenario: Angular SSR build resolves the generated client
- **WHEN** the production SSR build runs after Prisma generation
- **THEN** TypeScript resolves the generated Prisma client imports used by server-side code

### Requirement: PostgreSQL driver adapter runtime
The system SHALL create Prisma Client through the PostgreSQL driver adapter so SSR server code connects through `@prisma/adapter-pg` and `pg`.

#### Scenario: Server creates a database client
- **WHEN** the SSR Express server initializes server-only database access
- **THEN** it creates Prisma Client with a PostgreSQL driver adapter using the configured database URL

#### Scenario: Database readiness can be checked
- **WHEN** the SSR server handles a database readiness check
- **THEN** it verifies the Prisma adapter can execute a database query against the configured PostgreSQL database

### Requirement: Server-only database boundary
The system SHALL keep Prisma and PostgreSQL driver imports isolated to server-side code paths.

#### Scenario: Browser code does not import Prisma
- **WHEN** Angular browser application code under `src/app` is inspected
- **THEN** it does not import Prisma Client, `@prisma/adapter-pg`, or `pg`

#### Scenario: Express routes can reuse the database client
- **WHEN** a server-side Express route needs database access
- **THEN** it can import the shared server-only Prisma client module

### Requirement: Developer commands and documentation
The system SHALL provide package scripts and documentation for generating the Prisma client, validating the schema, applying local migrations, and running the SSR app with PostgreSQL.

#### Scenario: Developer prepares Prisma locally
- **WHEN** a developer follows the documented local setup
- **THEN** they can install dependencies, configure `.env`, generate the Prisma client, and apply migrations for schema `showroom`

#### Scenario: Verification command covers Prisma integration
- **WHEN** a developer runs the documented verification flow
- **THEN** it validates Prisma configuration and confirms the Angular SSR build succeeds with the database integration present

### Requirement: Server-only current profile data access
The system SHALL load current-user profile data through server-side code under `src/server/**` and MUST NOT expose Prisma or PostgreSQL driver imports to Angular browser code.

#### Scenario: Profile route reads through server
- **WHEN** an authenticated browser requests current profile data
- **THEN** the server resolves the session and reads the corresponding `users` table record through server-only Prisma access

#### Scenario: Browser code remains database-free
- **WHEN** Angular code under `src/app/**` is inspected
- **THEN** it does not import Prisma Client, `@prisma/adapter-pg`, `pg`, or server profile modules

### Requirement: Sanitized profile DTO
The system SHALL return a sanitized profile DTO that includes only fields safe for the current authenticated user to view.

#### Scenario: Profile DTO returned
- **WHEN** the server returns current profile data
- **THEN** the response includes safe identity, contact, tenant, role, status, 2FA, and account timestamp fields

#### Scenario: Sensitive fields excluded
- **WHEN** the profile DTO is inspected
- **THEN** it MUST NOT include password hashes, session token hashes, CSRF hashes, TOTP secrets, pending TOTP secrets, backup codes, reset OTPs, failed login counts, or lockout internals

### Requirement: Session-bound profile lookup
The system SHALL bind profile lookup to the authenticated session rather than accepting an arbitrary user ID from the client.

#### Scenario: Profile request has no user id parameter
- **WHEN** the profile endpoint is called
- **THEN** the server derives the user ID from the session cookie and ignores any attempt to read another user's profile

### Requirement: Auth database access remains server-only
The system SHALL keep all Prisma access for auth users, sessions, reset OTPs, TOTP secrets, and backup codes isolated to server-side modules.

#### Scenario: Auth routes use shared Prisma client
- **WHEN** an auth endpoint needs to read or write authentication records
- **THEN** it imports the shared server-only Prisma client from `src/server/**`

#### Scenario: Browser code avoids auth persistence imports
- **WHEN** Angular browser code is inspected
- **THEN** it does not import generated Prisma auth models, database adapters, PostgreSQL drivers, or server auth repositories

### Requirement: Auth migration and generated client verification
The system SHALL keep auth schema changes compatible with the configured Prisma 7 PostgreSQL setup and generated client output path.

#### Scenario: Auth schema validates
- **WHEN** a developer runs `npm run prisma:validate`
- **THEN** Prisma validates the auth models, relations, indexes, and datasource configuration without errors

#### Scenario: Auth client generation succeeds
- **WHEN** a developer runs `npm run prisma:generate`
- **THEN** the generated client includes auth fields and models under `src/generated/prisma`

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


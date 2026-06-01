## ADDED Requirements

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

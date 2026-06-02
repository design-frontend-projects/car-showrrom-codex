## ADDED Requirements

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

# rbac-api-client-state Specification

## Purpose
Define the server API boundary and Angular client-state contract for consuming tenant-scoped RBAC data without exposing server-only database dependencies to browser code.

## Requirements
### Requirement: Server-only RBAC API boundary
The system SHALL expose RBAC data to Angular through server-side API routes while keeping Prisma and PostgreSQL imports isolated to `src/server/**`.

#### Scenario: Browser code does not import database packages
- **WHEN** Angular browser code under `src/app/**` is inspected
- **THEN** it does not import Prisma Client, `@prisma/adapter-pg`, or `pg`

#### Scenario: RBAC routes use server database access
- **WHEN** an RBAC API route reads or writes tenants, users, roles, or permissions
- **THEN** it uses server-only Prisma database access under `src/server/**`

### Requirement: Tenant context propagation
The system SHALL propagate tenant context from Angular requests to trusted server-side database execution.

#### Scenario: Angular sends tenant header
- **WHEN** an authenticated Angular request has a selected tenant ID
- **THEN** the auth interceptor adds a tenant context header to the request

#### Scenario: Server validates tenant context
- **WHEN** the server receives a tenant context header
- **THEN** it validates that the authenticated caller can access that tenant before setting PostgreSQL tenant context

#### Scenario: Database context is set for tenant-scoped queries
- **WHEN** a server route performs tenant-scoped RBAC database work
- **THEN** it sets the PostgreSQL tenant context for that work before executing Prisma queries

### Requirement: RBAC Angular services
The system SHALL provide Angular services for tenant, user, role, and permission RBAC operations using the existing reusable HTTP API wrapper.

#### Scenario: Tenant service fetches tenant info
- **WHEN** Angular code requests current tenant details
- **THEN** `TenantService` fetches tenant information through the API wrapper

#### Scenario: User service manages tenant users
- **WHEN** Angular code creates, reads, updates, or deletes tenant users
- **THEN** `UserService` performs the corresponding authorized API request

#### Scenario: Role service manages roles and permissions
- **WHEN** Angular code manages roles or role-permission assignments
- **THEN** `RoleService` performs the corresponding authorized API request

#### Scenario: Permission service fetches permissions
- **WHEN** Angular code needs available permission actions
- **THEN** an RBAC service fetches permissions through the API wrapper

### Requirement: Reusable HTTP method overloads
The system SHALL preserve reusable HTTP helper methods that support URL-only calls and URL-with-params calls for RBAC services.

#### Scenario: URL-only request is supported
- **WHEN** an RBAC service calls a GET or DELETE endpoint without query parameters
- **THEN** the API helper supports the URL-only call

#### Scenario: URL-with-params request is supported
- **WHEN** an RBAC service calls an endpoint with query parameters
- **THEN** the API helper supports passing params without duplicating request-building logic

### Requirement: RBAC client state
The system SHALL provide NgRx Signal Store state for tenant, users, roles, and permissions.

#### Scenario: Tenant state loads current tenant
- **WHEN** the tenant store loads tenant data
- **THEN** it tracks tenant data, loading status, and errors

#### Scenario: User state manages user collection
- **WHEN** user CRUD operations complete
- **THEN** the users store reflects the resulting tenant user collection and operation status

#### Scenario: Role state manages roles and role permissions
- **WHEN** role or role-permission operations complete
- **THEN** the roles store reflects the resulting role collection and assignment state

#### Scenario: Permission state loads permission catalog
- **WHEN** permissions are fetched from the server
- **THEN** the permissions store exposes the tenant-scoped permission catalog and loading status

### Requirement: RBAC authorization error handling
The system SHALL surface authorization and tenant-context errors consistently through Angular services and stores.

#### Scenario: Unauthorized RBAC request redirects or reports auth error
- **WHEN** an RBAC API request returns an unauthorized response
- **THEN** existing auth interception behavior handles the authentication failure

#### Scenario: Forbidden RBAC request updates store error state
- **WHEN** an RBAC API request returns a forbidden response
- **THEN** the relevant RBAC store records an error state without clearing unrelated loaded data

### Requirement: Profile route uses authenticated state
The profile route SHALL use the existing authenticated state and guard behavior to prevent anonymous profile access.

#### Scenario: Auth guard protects profile
- **WHEN** a route activation check runs for `/client/profile`
- **THEN** unauthenticated users are blocked according to existing auth guard behavior

### Requirement: Profile API authorization errors
The Angular profile data layer SHALL surface profile API authorization failures as localized UI states without clearing unrelated authenticated session state.

#### Scenario: Forbidden or unauthorized profile response
- **WHEN** the profile API returns an authorization error while the page is loading
- **THEN** the profile page displays an access error and does not show stale profile details

### Requirement: Profile state does not expose secrets
Angular profile models and state SHALL store only the sanitized profile DTO returned by the server.

#### Scenario: Profile state is inspected
- **WHEN** profile state or models are reviewed
- **THEN** they contain no password hash, session token, CSRF hash, TOTP secret, backup code, or reset OTP fields

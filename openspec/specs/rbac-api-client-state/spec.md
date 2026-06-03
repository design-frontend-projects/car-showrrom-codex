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

### Requirement: Session identity drives RBAC authorization
The system SHALL use the authenticated server session identity as the trusted principal for RBAC API authorization and tenant-context validation.

#### Scenario: Authenticated RBAC request
- **WHEN** an authenticated user calls a tenant-scoped RBAC API route
- **THEN** the server resolves the user from the session cookie and validates tenant access before executing RBAC database work

#### Scenario: Anonymous RBAC request
- **WHEN** a request without a valid auth session calls an RBAC API route
- **THEN** the server rejects the request as unauthorized and does not set tenant database context

### Requirement: Auth failure updates RBAC client state consistently
The system SHALL keep RBAC services and stores consistent when auth session expiry, forbidden access, or tenant-context failures occur.

#### Scenario: Session expires during RBAC request
- **WHEN** an RBAC API request returns unauthorized because the auth session expired
- **THEN** the auth store becomes anonymous and the relevant RBAC store records an auth error without exposing stale privileged actions

#### Scenario: Forbidden tenant access
- **WHEN** an authenticated user requests a tenant they cannot access
- **THEN** the RBAC store records a forbidden error while preserving unrelated loaded data

### Requirement: Showroom authorization state
Angular client and admin routes SHALL use authenticated session and RBAC state to determine whether listing management and request review actions are available.

#### Scenario: Client menu visibility
- **WHEN** a logged-in client has listing-management permission
- **THEN** the app shell and client area expose sell/manage listing navigation

#### Scenario: Admin menu visibility
- **WHEN** a logged-in user lacks request-review permission
- **THEN** the app MUST NOT show administrative request review navigation

### Requirement: API authorization errors
Showroom Angular services SHALL surface server authorization failures as stable localized UI states.

#### Scenario: Permission denied response
- **WHEN** a showroom API returns an authorization error
- **THEN** the UI displays a localized access-denied state and does not continue optimistic updates

### Requirement: Role-aware session hydration
The system SHALL hydrate the sanitized logged-in user object and normalized role list into NgRx Signal Store state after login, session restoration, token or session refresh, and explicit role refresh.

#### Scenario: Login hydrates user and roles
- **WHEN** a user successfully logs in
- **THEN** the auth/RBAC store contains the sanitized user object, normalized role names, tenant context, loading status, and derived admin/system-owner flags

#### Scenario: Session restoration hydrates store
- **WHEN** the application starts with valid persisted auth state and a valid server session
- **THEN** the store is rehydrated from storage and reconciled with the server session response

#### Scenario: Role refresh updates derived flags
- **WHEN** the server reports changed role membership for the current user
- **THEN** the store updates the role list and recalculates derived authorization flags without requiring a full page reload

### Requirement: Configurable browser auth state persistence
The system SHALL persist only sanitized user and role state to configurable browser storage while keeping the NgRx Signal Store and storage synchronized.

#### Scenario: Session storage mode is configured
- **WHEN** the auth persistence configuration selects session storage
- **THEN** sanitized user and role state is written to `sessionStorage` and restored from `sessionStorage`

#### Scenario: Local storage mode is configured
- **WHEN** the auth persistence configuration explicitly selects local storage
- **THEN** sanitized user and role state is written to `localStorage` and restored from `localStorage`

#### Scenario: Logout clears persisted state
- **WHEN** the current user logs out or the server rejects the session as unauthorized
- **THEN** the store is reset and the persisted user and role state is removed from browser storage

### Requirement: Sensitive auth data exclusion
Angular auth persistence SHALL NOT store sensitive authentication secrets or server-only security fields in NgRx state intended for display or browser storage.

#### Scenario: Persisted state is inspected
- **WHEN** the serialized auth state in browser storage is inspected
- **THEN** it contains no password hash, session token, CSRF token hash, TOTP secret, pending TOTP secret, backup code, reset OTP, failed login count, or lockout internals

#### Scenario: Store user DTO is inspected
- **WHEN** the NgRx auth/RBAC store state is inspected
- **THEN** it contains only sanitized user, tenant, status, and role fields approved by the server DTO contract

### Requirement: Admin route and navigation authorization state
Angular navigation and route guards SHALL use the centralized auth/RBAC store to determine admin module visibility and access.

#### Scenario: Admin user sees admin button
- **WHEN** the current store roles include `admin` or `system-owner`
- **THEN** the application shell displays an accessible Admin module button that navigates to the admin module

#### Scenario: Non-admin user does not see admin button
- **WHEN** the current store roles do not include `admin` or `system-owner`
- **THEN** the application shell does not render the Admin module button

#### Scenario: Non-admin route access is blocked
- **WHEN** a non-admin user attempts to activate an admin route directly by URL
- **THEN** the route guard prevents activation and shows or redirects to a localized access-denied destination

### Requirement: Users and roles read model
Angular SHALL provide a read-only admin data model and state flow for displaying users and their role membership.

#### Scenario: Admin loads users and roles
- **WHEN** an authorized admin opens the users-and-roles utility
- **THEN** the UI displays sanitized users with role membership, active status, tenant context, and loading/error states

#### Scenario: User role list is searched
- **WHEN** an admin enters search or filter criteria
- **THEN** the displayed user-role list updates without exposing sensitive user fields

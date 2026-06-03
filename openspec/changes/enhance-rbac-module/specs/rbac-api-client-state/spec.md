## ADDED Requirements

### Requirement: Invited users admin API
The system SHALL expose admin/system-owner APIs for tenant-scoped invitation management through the server-only RBAC boundary.

#### Scenario: Admin fetches invitations
- **WHEN** an authorized admin requests invited users for the active tenant
- **THEN** the server returns sanitized invitation DTOs with status, timestamps, target roles, inviter, resulting user, and pending action eligibility

#### Scenario: Admin manages invitation lifecycle
- **WHEN** an authorized admin creates, resends, or revokes an invitation
- **THEN** the server validates tenant context, target role ownership, CSRF for cookie-authenticated mutations, and returns the updated sanitized invitation DTO

#### Scenario: Non-admin invitation API rejected
- **WHEN** a non-admin or anonymous caller requests an invitation management API
- **THEN** the server rejects the request and performs no invitation mutation

### Requirement: Invited users Angular service and store state
Angular SHALL model invited users through RBAC services and NgRx Signal Store state without exposing server-only dependencies.

#### Scenario: Invitations load into RBAC state
- **WHEN** the invited-users workspace loads
- **THEN** the RBAC store tracks invitations, loading status, mutation status, errors, and derived pending invitation counts

#### Scenario: Invitation mutation updates state
- **WHEN** create, resend, revoke, or acceptance refresh completes
- **THEN** the RBAC store updates the affected invitation without clearing unrelated users, roles, permissions, or audit state

#### Scenario: Browser code stays database-free
- **WHEN** Angular invitation services, stores, routes, or components are inspected
- **THEN** they do not import Prisma Client, `@prisma/adapter-pg`, `pg`, password hashing modules, token hashing modules, or server-only auth helpers

### Requirement: Invited users management UI state
Angular SHALL render invited-user management with complete loading, empty, error, and action states.

#### Scenario: Invitation table displays pending actions
- **WHEN** an invitation is pending
- **THEN** the UI displays clear status, expiration, target role labels, and enabled resend/revoke actions subject to server authorization

#### Scenario: Completed invitation displays resulting user
- **WHEN** an invitation has been accepted
- **THEN** the UI displays accepted status, accepted timestamp, and safe resulting user identity without showing resend or revoke as active actions

#### Scenario: Invitation errors preserve data
- **WHEN** an invitation API request fails with unauthorized, forbidden, validation, conflict, expired, or rate-limit errors
- **THEN** the RBAC store records the localized error state without exposing stale privileged actions or clearing unrelated loaded data

### Requirement: Onboarding API client state
Angular SHALL provide an unauthenticated invited-user onboarding client flow that remains separate from full authenticated session state.

#### Scenario: Onboarding challenge state is temporary
- **WHEN** an invited user enters onboarding
- **THEN** Angular stores only non-secret onboarding status and challenge metadata needed to render the flow

#### Scenario: Onboarding success resets temporary state
- **WHEN** invitation acceptance succeeds
- **THEN** Angular clears onboarding state and does not mark the auth store as authenticated until normal login succeeds

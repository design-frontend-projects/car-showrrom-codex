## ADDED Requirements

### Requirement: Invited users management workspace
The system SHALL provide an admin/system-owner invited-users workspace that lists tenant-scoped invitations and their onboarding state.

#### Scenario: Admin opens invited users workspace
- **WHEN** an authenticated user with `admin` or `system-owner` role opens the invited-users workspace
- **THEN** the screen displays invited users with email, display name when available, status, target roles, inviter, resulting user when accepted, expiration, accepted, revoked, resent, created, and updated timestamps

#### Scenario: Pending onboarding actions are visible
- **WHEN** an invitation is pending and not expired or revoked
- **THEN** the screen displays pending onboarding actions such as resend and revoke without exposing token hashes or password data

#### Scenario: Non-admin cannot access invited users workspace
- **WHEN** an authenticated user without `admin` or `system-owner` role attempts to open the invited-users workspace
- **THEN** the route guard blocks access and the server rejects any direct invited-users API request as forbidden

### Requirement: Invited identity first-time access
The system SHALL recognize pending invited identities and direct them to a secure onboarding flow instead of treating first access as normal password login.

#### Scenario: Pending invitation starts onboarding
- **WHEN** a person attempts first-time access with an email or invitation token that matches a pending, unexpired, non-revoked invitation
- **THEN** the system allows only the invited-user onboarding flow and does not create a full authenticated session

#### Scenario: Invalid invitation does not start onboarding
- **WHEN** a person attempts first-time access with an unknown, accepted, expired, or revoked invitation
- **THEN** the system rejects onboarding with a safe error state and does not reveal token hashes, password hashes, or tenant internals

#### Scenario: Existing account uses normal login
- **WHEN** the invited email already belongs to an accepted user with a valid password
- **THEN** the system keeps that user on the normal login path unless a pending invitation token is explicitly accepted

### Requirement: Invited user password setup
The system SHALL let an invited user set their first password through a constrained onboarding form bound to the invited email identity.

#### Scenario: Password setup form opens
- **WHEN** an invited user enters the onboarding flow from a valid invitation
- **THEN** the form displays the invited email as a non-editable identity, accepts display name and optional phone fields, and validates password policy before submission

#### Scenario: Password setup succeeds
- **WHEN** an invited user submits a valid onboarding payload for a pending invitation
- **THEN** the server stores only a hashed password on the canonical user record and returns a success result without creating an authenticated session

#### Scenario: Password setup rejects weak password
- **WHEN** an invited user submits a password that fails the configured password policy
- **THEN** the onboarding form displays localized validation errors and no user, role, or invitation acceptance write is committed

### Requirement: Invitation acceptance migration
The system SHALL migrate accepted invited identities into the canonical `users` and `user_roles` persistence model in one server-controlled transaction.

#### Scenario: New invited user becomes canonical user
- **WHEN** a pending invitation is accepted for an email that does not already exist in the invitation tenant
- **THEN** the server creates a `User` using the exact Prisma `User` attributes and creates `UserRole` rows for the invitation target roles

#### Scenario: Existing tenant user receives invitation roles
- **WHEN** a pending invitation is accepted for an email that already exists in the same tenant
- **THEN** the server updates the existing `User` according to the accepted onboarding payload and upserts `UserRole` rows without creating duplicate users or duplicate user-role assignments

#### Scenario: Role validation blocks partial migration
- **WHEN** an invitation target role no longer belongs to the invitation tenant
- **THEN** the server rejects acceptance and commits no user, user-role, invitation, or audit mutation

### Requirement: Post-onboarding cleanup and redirect
The system SHALL complete the invitation lifecycle after successful onboarding and return the user to normal authentication.

#### Scenario: Invitation is marked accepted
- **WHEN** onboarding succeeds
- **THEN** the invitation is marked `accepted`, `acceptedAt` is populated, `resultingUserId` references the canonical user, and an RBAC audit event records the acceptance without secret metadata

#### Scenario: Temporary onboarding state is cleared
- **WHEN** onboarding succeeds or the invited user exits the flow
- **THEN** temporary onboarding state is cleared from client state and browser storage

#### Scenario: User is redirected to login
- **WHEN** onboarding succeeds
- **THEN** the user is redirected to the login screen to authenticate with the newly created credentials

## ADDED Requirements

### Requirement: Dedicated authenticated profile route
The system SHALL render a dedicated profile page for `/client/profile` and require an authenticated session before profile data is shown.

#### Scenario: Authenticated user opens profile
- **WHEN** a logged-in user navigates to `/client/profile`
- **THEN** the app renders the dedicated profile page instead of the generic client shell

#### Scenario: Anonymous user opens profile
- **WHEN** an anonymous user navigates to `/client/profile`
- **THEN** the app MUST prevent profile data from rendering and use the existing authentication guard behavior

### Requirement: Real user data preview
The profile page SHALL display sanitized real account data loaded from the current user's `users` table record and related tenant/role records.

#### Scenario: Profile data loads
- **WHEN** the profile API returns the current user's profile DTO
- **THEN** the page displays display name, email, phone fallback or value, avatar fallback or value, tenant, roles, account status, 2FA state, last login when available, created date, and updated date

#### Scenario: Nullable profile fields
- **WHEN** optional fields such as phone, avatar URL, or last login are missing
- **THEN** the page displays localized fallback values instead of raw `null`, `undefined`, or empty text

### Requirement: Profile page states
The profile page SHALL provide clear loading, error, unauthorized, and unavailable states.

#### Scenario: Profile is loading
- **WHEN** the profile page is waiting for the profile API response
- **THEN** the UI displays a polished loading state without showing stale profile details

#### Scenario: Profile request fails
- **WHEN** the profile API returns an error
- **THEN** the UI displays a localized error state and a retry action when retrying is safe

### Requirement: Profile security links
The profile page SHALL expose clear navigation to existing security and settings workflows without implementing those workflows itself.

#### Scenario: Security status visible
- **WHEN** the profile page displays a user with 2FA enabled or required
- **THEN** it shows the current 2FA state and a link or action to the existing security page

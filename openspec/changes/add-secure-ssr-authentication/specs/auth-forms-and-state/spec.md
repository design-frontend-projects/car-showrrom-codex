## ADDED Requirements

### Requirement: Signal-form auth screens
The system SHALL implement registration, login, password reset, and 2FA forms with Angular signal forms and schema-based validation.

#### Scenario: Registration form validates fields
- **WHEN** a user edits registration fields
- **THEN** the signal-form schema exposes translated validation states for required name, email format, phone format when provided, and password policy

#### Scenario: Login form submits valid payload
- **WHEN** a user submits a valid login form
- **THEN** Angular sends only the expected email and password payload to the same-origin auth API and never includes browser-held tokens

#### Scenario: Reset forms preserve step state
- **WHEN** a user completes reset request, OTP verification, and new password steps
- **THEN** each step uses signal-form validation and only advances after the server accepts the previous step

#### Scenario: 2FA forms validate codes
- **WHEN** a user enters TOTP, OTP, or backup code values
- **THEN** the signal-form schema validates required length/format and surfaces translated messages before submission

### Requirement: Auth NgRx Signal Store
The system SHALL expose auth state through an NgRx Signal Store that can be consumed by any Angular component, guard, interceptor, or shell control.

#### Scenario: Session loads during app startup
- **WHEN** the app initializes during SSR or browser hydration
- **THEN** the auth store calls the server session endpoint and exposes anonymous, pending, authenticated, or 2FA-required state as signals

#### Scenario: Login updates auth state
- **WHEN** login or 2FA verification succeeds
- **THEN** the auth store stores the sanitized current user and session metadata without persisting access or refresh tokens in browser storage

#### Scenario: Auth failure updates errors
- **WHEN** an auth API call fails with validation, authorization, rate-limit, CSRF, or 2FA errors
- **THEN** the auth store exposes translated error keys without clearing unrelated successful state unless the session is invalid

### Requirement: SSR-safe auth API client
The system SHALL route Angular auth operations through same-origin API services that are safe for SSR and do not import server-only modules into browser code.

#### Scenario: SSR session request
- **WHEN** Angular SSR renders a route that needs auth state
- **THEN** it obtains auth state through the Express auth API/session boundary rather than direct Prisma access from Angular code

#### Scenario: Browser request includes CSRF token
- **WHEN** Angular sends a mutating cookie-authenticated auth request from the browser
- **THEN** the auth API client or interceptor includes the current CSRF token header

### Requirement: Topbar authenticated account UI
The system SHALL update the app shell topbar and mobile drawer to present authenticated account controls and anonymous auth entry points responsively.

#### Scenario: Authenticated desktop topbar
- **WHEN** an authenticated desktop user views the app shell
- **THEN** the topbar shows the user's avatar or initials, display name where space allows, account menu, 2FA/settings action, local signout, and global signout

#### Scenario: Anonymous topbar
- **WHEN** an anonymous user views the app shell
- **THEN** the shell shows registration and sign-in entry points without exposing account-only menu items

#### Scenario: Mobile account controls
- **WHEN** an authenticated mobile user opens the drawer
- **THEN** account actions remain reachable, touch-friendly, translated, and free of horizontal overflow

### Requirement: Auth route protection
The system SHALL use auth store state to protect routes and redirect anonymous or partially authenticated users to the appropriate login or 2FA step.

#### Scenario: Anonymous user opens protected route
- **WHEN** an anonymous user navigates to a protected client or admin route
- **THEN** the route guard redirects to sign-in and preserves an allowed return URL

#### Scenario: 2FA challenge user opens protected route
- **WHEN** a user has passed password verification but has not completed required 2FA
- **THEN** the route guard keeps the user on the 2FA verification/setup flow instead of granting route access

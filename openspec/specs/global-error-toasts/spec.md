# global-error-toasts Specification

## Purpose
TBD - created by archiving change add-global-error-toast-interceptor. Update Purpose after archive.
## Requirements
### Requirement: Global backend error toast
The system SHALL display a PrimeNG toast when a browser HTTP request receives a backend error response with a user-facing message.

#### Scenario: Backend returns plain message
- **WHEN** an HTTP request fails with a backend error payload containing a plain message
- **THEN** the system displays that message in a PrimeNG error toast

#### Scenario: Backend error has no safe message
- **WHEN** an HTTP request fails without a user-facing backend message
- **THEN** the system displays a localized generic error toast message

### Requirement: Error propagation
The system MUST rethrow the original HTTP error after global toast handling.

#### Scenario: Caller handles failed request
- **WHEN** an HTTP request fails and the global error interceptor displays a toast
- **THEN** the original error remains available to the subscribing caller's error handler

### Requirement: Browser-only toast emission
The system SHALL avoid emitting PrimeNG toast notifications during server-side rendering.

#### Scenario: Request fails during SSR
- **WHEN** an HTTP request fails while the app is running on the server platform
- **THEN** the system rethrows the original error without displaying a toast

### Requirement: Root toast host
The system SHALL include one app-wide PrimeNG Toast host so global error messages can render across routes.

#### Scenario: Error occurs on any route
- **WHEN** a backend HTTP error occurs while any Angular route is active
- **THEN** the error toast is displayed through the app-wide PrimeNG Toast host


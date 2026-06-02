## ADDED Requirements

### Requirement: RBAC admin workspace
The system SHALL expose a lazy-loaded RBAC administration workspace under the existing admin feature for authorized administrators.

#### Scenario: Admin opens RBAC workspace
- **WHEN** an authorized administrator navigates to the RBAC admin area
- **THEN** the UI displays navigation for users, roles, permissions, assignments, and audit activity without leaving the admin route tree

#### Scenario: RBAC workspace is responsive
- **WHEN** the RBAC admin workspace is viewed on desktop and mobile widths
- **THEN** tables, filters, dialogs, and action toolbars remain usable without overlapping text or controls

### Requirement: User management screens
The system SHALL provide user management screens for active users, pending invitations, disabled users, user details, registration, invitation, profile editing, role assignment, and password reset initiation.

#### Scenario: Users are separated by lifecycle state
- **WHEN** an administrator views user management
- **THEN** active users, pending invitations, and disabled users are visually separated through tabs, segmented filters, or equivalent controls

#### Scenario: Administrator edits user profile fields
- **WHEN** an administrator updates a user's display name, email, phone, avatar URL, active state, or assigned roles
- **THEN** the UI validates the form, submits the change through the RBAC admin API, and refreshes the affected user state

#### Scenario: Administrator invites a user
- **WHEN** an administrator submits a valid invitation with email, display name, and initial roles
- **THEN** the UI shows the pending invitation and displays success feedback without exposing the stored token hash

#### Scenario: Administrator initiates password reset
- **WHEN** an administrator requests a password reset for an existing user
- **THEN** the UI calls the server reset initiation endpoint and shows a confirmation state without exposing reset OTP or token secrets

### Requirement: Role management screens
The system SHALL provide role list and role detail screens for creating roles, editing roles, deleting eligible roles, viewing assigned users, and assigning permissions.

#### Scenario: Administrator creates or edits role
- **WHEN** an administrator submits a role name and description
- **THEN** the UI validates required fields, persists the role through the RBAC admin API, and shows the updated role list

#### Scenario: System role destructive action is blocked
- **WHEN** an administrator views a system role
- **THEN** destructive actions such as delete are disabled or hidden and the role detail explains the protected state through accessible UI text

#### Scenario: Role detail shows assigned users
- **WHEN** an administrator opens a role detail screen
- **THEN** the UI displays users assigned to that role and provides navigation back to relevant user details

### Requirement: Permission management screens
The system SHALL provide permission list and assignment screens that group permissions by module and support role-permission assignment through clear toggles or checkboxes.

#### Scenario: Permissions are grouped by module
- **WHEN** permissions are loaded
- **THEN** the UI groups permission actions by their module prefix or server-provided group metadata

#### Scenario: Permission matrix updates role assignments
- **WHEN** an administrator toggles a permission for a role
- **THEN** the UI submits the assignment mutation, shows loading feedback for the affected cell or row, and rolls back optimistic state if the server rejects the change

### Requirement: Audit activity screen
The system SHALL provide an audit activity screen for RBAC administration events recorded by the server.

#### Scenario: Administrator views audit activity
- **WHEN** an administrator opens the audit activity screen
- **THEN** the UI displays recent RBAC events with actor, action, target, timestamp, and sanitized metadata

#### Scenario: No audit activity exists
- **WHEN** the server returns no audit events
- **THEN** the UI displays an empty state instead of a broken table or stale data

### Requirement: Enterprise RBAC UI states
The system SHALL provide consistent loading, empty, error, confirmation, toast, and skeleton states for RBAC admin screens.

#### Scenario: RBAC screen loads data
- **WHEN** a RBAC admin screen is waiting for API data
- **THEN** the UI displays skeletons or progress states appropriate to the target layout

#### Scenario: RBAC mutation fails
- **WHEN** a RBAC admin mutation fails validation, authorization, or server processing
- **THEN** the UI shows localized feedback and preserves unrelated loaded screen state

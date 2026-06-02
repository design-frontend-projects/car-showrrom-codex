## ADDED Requirements

### Requirement: Role and permission route guards
The system SHALL provide Angular route guards for role-based and permission-based access to RBAC administration routes.

#### Scenario: Admin route requires permission
- **WHEN** a user navigates to a RBAC administration route requiring `showroom.admin.manage`
- **THEN** the route activates only when authenticated state includes that permission or an equivalent administrative role

#### Scenario: Unauthorized navigation is blocked
- **WHEN** an authenticated user without required RBAC access navigates to a protected admin route
- **THEN** the guard blocks activation and routes the user to an access-denied or safe fallback state

### Requirement: Permission-aware navigation
The system SHALL show, hide, or disable admin navigation items according to the current user's roles and permissions.

#### Scenario: User lacks RBAC admin permission
- **WHEN** the application shell renders navigation for a logged-in user without RBAC admin access
- **THEN** RBAC administration navigation is not shown as an available action

#### Scenario: User gains RBAC admin permission
- **WHEN** authenticated state refreshes and includes RBAC admin access
- **THEN** RBAC administration navigation becomes available without requiring a full page reload

### Requirement: Permission-aware component actions
The system SHALL protect privileged UI actions inside RBAC screens by disabling or hiding controls when the current user lacks required permissions.

#### Scenario: Action requires permission
- **WHEN** a RBAC screen renders create, edit, delete, invite, revoke, reset, or assignment controls
- **THEN** each control is enabled only when the current user has the matching administrative permission and the target record is eligible

#### Scenario: Client-side permission state is stale
- **WHEN** the UI displays an action but the server rejects it as forbidden
- **THEN** the UI shows an access-denied state and refreshes authorization-sensitive state

### Requirement: Backend authorization remains authoritative
The system SHALL treat Angular guards and hidden controls as usability features while server-side RBAC checks remain authoritative.

#### Scenario: Direct API call bypasses UI
- **WHEN** a user calls a RBAC admin API mutation directly without required permission
- **THEN** the server rejects the request even if the Angular client would normally hide that action

### Requirement: Localized access feedback
The system SHALL present localized feedback for RBAC access failures.

#### Scenario: Guard blocks route
- **WHEN** a route guard blocks access due to missing role, missing permission, anonymous session, or tenant mismatch
- **THEN** the user sees a localized access-denied, sign-in, or tenant-error state appropriate to the failure

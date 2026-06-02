## ADDED Requirements

### Requirement: Polished profile composition
The profile page SHALL follow the existing visual system with restrained surfaces, clear hierarchy, readable metadata, accessible contrast, and professional account-dashboard styling.

#### Scenario: Profile summary renders
- **WHEN** profile data is available
- **THEN** the summary area presents avatar or initials, display name, email, account status, and primary navigation actions without clipped text

### Requirement: Profile interaction states
The profile page SHALL provide accessible hover, focus, loading, disabled, empty, and error states for profile actions and content sections.

#### Scenario: Keyboard navigation through profile actions
- **WHEN** a keyboard user tabs through profile page actions and links
- **THEN** each focused element has a visible focus state with sufficient contrast

### Requirement: Account metadata readability
The profile page SHALL present contact, security, tenant, role, and timeline data in compact sections that can be scanned quickly.

#### Scenario: Metadata section renders
- **WHEN** the profile page displays account metadata
- **THEN** labels, values, icons, and status chips remain visually distinct and do not overlap at supported breakpoints

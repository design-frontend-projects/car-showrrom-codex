## ADDED Requirements

### Requirement: Client Add Vehicle database-backed dropdowns
The client Add Vehicle form SHALL load dropdown values asynchronously from database-backed vehicle definition APIs.

#### Scenario: Load client listing options
- **WHEN** a registered client opens the listing creation form
- **THEN** make, condition, color, and other available vehicle definition dropdowns are loaded from server DTOs backed by Prisma models rather than static browser lists

#### Scenario: Search client listing options
- **WHEN** a registered client searches a dropdown value
- **THEN** the dropdown filters against database-backed options and displays a localized empty state when no values match

### Requirement: Client Add Vehicle dependent dropdowns
The client Add Vehicle form SHALL load model and trim options dynamically based on parent selections.

#### Scenario: Client selects make
- **WHEN** a registered client selects a make
- **THEN** the form fetches models for that make, clears any stale model and trim selections, and keeps unrelated entered fields unchanged

#### Scenario: Client selects model
- **WHEN** a registered client selects a model
- **THEN** the form fetches trims for that model, clears any stale trim selection, and avoids requesting trims for unrelated models

### Requirement: Client Add Vehicle server validation feedback
The client listing creation workflow SHALL project server validation responses into the form.

#### Scenario: Client submits invalid listing
- **WHEN** a registered client submits missing fields, invalid numeric ranges, inactive options, or an invalid taxonomy hierarchy
- **THEN** the server rejects the mutation and the UI displays field-level feedback based on the server response

#### Scenario: Client retries listing creation
- **WHEN** a listing creation request fails because of a transient server or network error
- **THEN** the UI keeps the draft values and allows the client to retry without reselecting dropdown values

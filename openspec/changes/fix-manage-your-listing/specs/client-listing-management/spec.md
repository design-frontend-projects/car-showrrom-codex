## MODIFIED Requirements

### Requirement: Client Add Vehicle database-backed dropdowns
The client Add Vehicle form SHALL load dropdown values asynchronously from database-backed vehicle definition APIs and SHALL initialize required dropdown values only from active loaded options.

#### Scenario: Load client listing options
- **WHEN** a registered client opens the listing creation form
- **THEN** make, condition, color, and other available vehicle definition dropdowns are loaded from server DTOs backed by Prisma models rather than static browser lists

#### Scenario: Search client listing options
- **WHEN** a registered client searches a dropdown value
- **THEN** the dropdown filters against database-backed options and displays a localized empty state when no values match

#### Scenario: Initialize condition from active options
- **WHEN** a registered client opens the listing creation form and active condition options are returned
- **THEN** the form selects a valid active condition option code before allowing submission

#### Scenario: Condition options unavailable
- **WHEN** the condition option request returns no active options or fails
- **THEN** the form MUST keep listing submission disabled and show validation feedback for the required condition field

### Requirement: Client Add Vehicle server validation feedback
The client listing creation workflow SHALL project server validation responses into the form, including required dropdown fields whose values come from database-backed options.

#### Scenario: Client submits invalid listing
- **WHEN** a registered client submits missing fields, invalid numeric ranges, inactive options, or an invalid taxonomy hierarchy
- **THEN** the server rejects the mutation and the UI displays field-level feedback based on the server response

#### Scenario: Client retries listing creation
- **WHEN** a listing creation request fails because of a transient server or network error
- **THEN** the UI keeps the draft values and allows the client to retry without reselecting dropdown values

#### Scenario: Condition validation error displayed
- **WHEN** the server returns `fieldErrors.condition` for a listing creation attempt
- **THEN** the UI MUST display the localized condition error next to or within the visible listing form validation area without clearing the user's other draft values

### Requirement: Listing form validation
The listing management UI and server APIs SHALL validate required fields, numeric ranges, enum values, ownership references, database-backed option values, and cross-field rules.

#### Scenario: Invalid listing form
- **WHEN** a client submits missing required fields or invalid price, mileage, year, taxonomy, or condition values
- **THEN** the UI displays localized field errors based on server and client validation feedback

#### Scenario: Missing required condition
- **WHEN** a client has not selected a valid loaded condition option
- **THEN** the UI MUST block submission before sending the listing mutation

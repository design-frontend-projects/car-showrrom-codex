## ADDED Requirements

### Requirement: Admin vehicle color selection
The system SHALL let administrators select vehicle exterior and interior colors from active tenant color definition catalogs on the admin vehicle creation and editing screens.

#### Scenario: Open create vehicle color selectors
- **WHEN** an authorized administrator opens `/admin/vehicles/create`
- **THEN** the exterior color and interior color fields render as searchable dropdowns populated from active tenant exterior and interior color definitions

#### Scenario: Color options show swatches
- **WHEN** an administrator opens an exterior or interior color dropdown
- **THEN** each color option displays its swatch when a hex value exists, localized label when available, canonical name fallback, and active-state-safe metadata without overlapping text

#### Scenario: Vehicle preview reflects selected colors
- **WHEN** an administrator changes exterior or interior color selections in the vehicle editor
- **THEN** the live preview and confirmation modal update without a page reload and include the selected color labels where the preview layout supports color metadata

#### Scenario: Existing inactive color remains understandable
- **WHEN** an administrator edits a listing that references a color definition that has since been deactivated
- **THEN** the editor displays the existing selected color as a legacy or inactive value while preventing it from being chosen for unrelated new selections

### Requirement: Admin vehicle color validation
The system SHALL validate selected exterior and interior color references on the client and server before creating or updating a listing.

#### Scenario: Invalid exterior color rejected
- **WHEN** an administrator submits a vehicle with an exterior color ID that does not belong to the current tenant exterior color catalog
- **THEN** the server MUST reject the request without creating or updating the listing

#### Scenario: Invalid interior color rejected
- **WHEN** an administrator submits a vehicle with an interior color ID that does not belong to the current tenant interior color catalog
- **THEN** the server MUST reject the request without creating or updating the listing

#### Scenario: Color fields remain optional
- **WHEN** an administrator submits a valid vehicle without exterior or interior color selections
- **THEN** the server persists the listing with null color IDs and no color display-name fallback for the missing selections

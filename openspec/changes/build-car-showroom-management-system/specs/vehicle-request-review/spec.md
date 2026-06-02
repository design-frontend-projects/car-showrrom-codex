## ADDED Requirements

### Requirement: Vehicle request submission
Registered clients SHALL be able to submit vehicle requests containing desired vehicle details, budget, contact preference, notes, and request metadata.

#### Scenario: Submit vehicle request
- **WHEN** a logged-in client submits a valid vehicle request
- **THEN** the system stores the request with `PENDING_REVIEW` status and associates it with the client and tenant

#### Scenario: Anonymous request blocked
- **WHEN** an anonymous user attempts to submit a vehicle request
- **THEN** the system MUST require authentication before storing the request

### Requirement: Administrative request queue
Authorized administrators SHALL be able to view pending, approved, and rejected vehicle requests for their tenant.

#### Scenario: Admin views pending requests
- **WHEN** an authorized administrator opens the request review page
- **THEN** the system displays pending requests with client-safe details, submitted time, and available review actions

### Requirement: Approve or reject request
Authorized administrators SHALL be able to approve or reject a vehicle request with an optional decision note.

#### Scenario: Approve request
- **WHEN** an administrator approves a pending request
- **THEN** the system records the approved status, reviewer user, decision note when provided, and reviewed timestamp

#### Scenario: Reject request
- **WHEN** an administrator rejects a pending request
- **THEN** the system records the rejected status, reviewer user, decision note when provided, and reviewed timestamp

### Requirement: Client request status visibility
Registered clients SHALL be able to view the status and admin decision notes for their own vehicle requests.

#### Scenario: Client views own request result
- **WHEN** a client opens their request history
- **THEN** the UI displays their submitted requests with current status and available decision details

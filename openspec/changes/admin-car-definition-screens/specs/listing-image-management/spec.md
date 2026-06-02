## ADDED Requirements

### Requirement: Admin image upload queue
The system SHALL allow authorized administrators to stage multiple listing images before final vehicle submission.

#### Scenario: Stage multiple images
- **WHEN** an administrator drops or selects multiple supported image files on the admin vehicle form
- **THEN** the UI adds the files to a local upload queue with preview thumbnails and validation status

#### Scenario: Remove staged image
- **WHEN** an administrator removes a queued image before submission
- **THEN** the image is removed from the queue and is not uploaded or linked to the listing

#### Scenario: Unsupported queued image rejected
- **WHEN** an administrator stages an unsupported file type or oversized image
- **THEN** the UI rejects that file and displays validation feedback without blocking valid queued images

### Requirement: Admin image ordering before submit
The system SHALL allow administrators to reorder staged and persisted images before saving the final listing gallery order.

#### Scenario: Reorder queued images
- **WHEN** an administrator drags image thumbnails into a new order before submitting
- **THEN** the UI preserves that order for upload and persisted gallery ordering

#### Scenario: Persist admin image order
- **WHEN** admin image uploads complete and the selected order is submitted
- **THEN** the server stores deterministic `sortOrder` values for the listing images

### Requirement: Admin upload progress
The system SHALL display upload progress and final result state for each image uploaded through the admin vehicle workflow.

#### Scenario: Show per-file upload progress
- **WHEN** the admin vehicle form uploads queued images
- **THEN** the UI displays progress or pending/uploading/succeeded/failed state for each image

#### Scenario: Retry failed image
- **WHEN** an image upload fails after the listing is saved
- **THEN** the administrator can retry that image without re-entering vehicle details

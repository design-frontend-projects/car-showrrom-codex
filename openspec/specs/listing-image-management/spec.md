# listing-image-management Specification

## Purpose
TBD - created by archiving change build-car-showroom-management-system. Update Purpose after archive.
## Requirements
### Requirement: Listing image upload
The system SHALL allow authenticated listing owners and authorized administrators to upload supported image files and associate each uploaded image with exactly one car listing.

#### Scenario: Successful listing image upload
- **WHEN** an authorized actor uploads a valid `jpg`, `jpeg`, `png`, or `webp` image for a listing they can manage
- **THEN** the system stores the file through the uploader service and creates image metadata linked to that listing

#### Scenario: Unauthorized image upload
- **WHEN** a user uploads an image for a listing they do not own and cannot administer
- **THEN** the system MUST reject the upload without storing public image metadata for that listing

### Requirement: Image validation
The system SHALL validate image size, extension, MIME type, and detected file signature before accepting an upload.

#### Scenario: Unsupported file rejected
- **WHEN** a user uploads a file with an unsupported type, invalid signature, or excessive size
- **THEN** the system MUST reject the file and return a translated validation error code

### Requirement: Image ordering and primary image
The system SHALL support deterministic image ordering and exactly one primary image per listing when images exist.

#### Scenario: Set primary image
- **WHEN** a listing owner marks an image as primary
- **THEN** the system updates the listing images so that only that image is primary for the listing

#### Scenario: Reorder gallery images
- **WHEN** a listing owner submits a new order for listing images
- **THEN** the system persists the order and public galleries render images in that order

### Requirement: Safe public image serving
The system SHALL expose listing images through safe media URLs that do not reveal arbitrary filesystem paths or allow path traversal.

#### Scenario: Public image request
- **WHEN** a public user views an active listing with images
- **THEN** the system returns image URLs that resolve only to stored listing media files


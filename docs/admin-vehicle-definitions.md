# Admin Vehicle Definitions

## Authorization

All admin definition endpoints require an authenticated showroom context and server-side authorization. A user must have the normalized `admin` role, the normalized `system-owner` role, or the `showroom.admin.manage` permission in the active tenant. Angular guards and hidden navigation are UX controls only; the server remains the enforcement layer.

## Endpoints

All endpoints are under `/api/showroom` and require tenant context through the existing tenant header/session flow.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/users-roles` | Return sanitized tenant users and role membership. Supports `q`, `role`, and `state` filters. |
| `GET` | `/admin/definitions/:entity` | List vehicle definition records. Supports `q` and `includeInactive`. |
| `POST` | `/admin/definitions/:entity` | Create a tenant-scoped vehicle definition record. |
| `PATCH` | `/admin/definitions/:entity/:definitionId` | Update a vehicle definition record. |
| `DELETE` | `/admin/definitions/:entity/:definitionId` | Deactivate a vehicle definition record. |

Supported entities are `makes`, `models`, `trims`, `engines`, `transmissions`, `fuel-types`, `body-types`, and `conditions`.

## Data Contracts

Make records use `name`, optional `country`, and `isActive`. Model records require `makeId` and `name`, with optional `productionFrom`, `productionTo`, and `isActive`. Trim records require `modelId` and `name`, and may reference `engineId`, `transmissionId`, `fuelTypeId`, and `bodyTypeId`. Catalog records use `name`, optional `code`, `description`, `localizedNames`, `sortOrder`, and `isActive`.

The users-and-roles response includes only safe identity fields, active status, timestamps, and role metadata. Password hashes, token hashes, OTP data, backup codes, and lockout internals are never returned.

## Cache And Audit

Vehicle catalog lists use tenant-aware cache keys with short TTLs. Definition create, update, and deactivate operations invalidate affected tenant catalog cache entries before subsequent reads.

Successful definition create, update, and deactivate operations record `RbacAuditEvent` entries with actor, tenant, action, target type, target id, and sanitized metadata. Failed authorization does not write mutation audit records.

## Error Handling

Validation errors use stable translation keys such as `showroom.error.validation`, `showroom.error.invalidTaxonomy`, and `showroom.error.definitionEntity`. Clients should display field-level errors when `fieldErrors` are present and global retry states for failed loads.

# Vehicle And RBAC Schema Contract

This document maps the frontend vehicle-definition and role-aware session contracts to `prisma/schema.prisma`. Browser code must consume these through HTTP DTOs only; Prisma, `pg`, and server modules remain under `src/server/**`.

## Vehicle Definition Entities

| Frontend entity | Prisma model | Table | Required fields | Optional fields | Relationships and constraints |
| --- | --- | --- | --- | --- | --- |
| Car make | `CarMake` | `car_makes` | `id: String @db.Uuid`, `tenantId: String @map("tenant_id") @db.Uuid`, `name: String`, `normalizedName: String @map("normalized_name")`, `isActive: Boolean @map("is_active")`, `createdAt`, `updatedAt` | `country: String?` | Belongs to `Tenant`; has many `CarModel`; unique `[tenantId, id]` and `[tenantId, normalizedName]`. |
| Car model | `CarModel` | `car_models` | `id`, `tenantId`, `makeId: String @map("make_id") @db.Uuid`, `name`, `normalizedName`, `isActive`, `createdAt`, `updatedAt` | `productionFrom: Int? @map("production_from")`, `productionTo: Int? @map("production_to")` | Belongs to `Tenant` and `CarMake`; has many `CarVariant`; unique `[tenantId, id]` and `[tenantId, makeId, normalizedName]`. |
| Trim | `CarVariant` | `car_variants` | `id`, `tenantId`, `modelId: String @map("model_id") @db.Uuid`, `name`, `normalizedName`, legacy enum fields `bodyType`, `fuelType`, `transmission`, `isActive`, `createdAt`, `updatedAt` | `engineId`, `transmissionId`, `fuelTypeId`, `bodyTypeId`, `driveTrain` | Belongs to `Tenant` and `CarModel`; optionally references `VehicleEngine`, `VehicleTransmission`, `VehicleFuelType`, and `VehicleBodyType`; unique `[tenantId, id]` and `[tenantId, modelId, normalizedName]`. |
| Engine | `VehicleEngine` | `vehicle_engines` | `id`, `tenantId`, `name`, `normalizedName`, `localizedNames: Json`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` | `code`, `description` | Belongs to `Tenant`; referenced by `CarVariant.engineId`; unique `[tenantId, id]`, `[tenantId, normalizedName]`, `[tenantId, code]`. |
| Transmission | `VehicleTransmission` | `vehicle_transmissions` | `id`, `tenantId`, `name`, `normalizedName`, `localizedNames`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` | `code`, `description` | Belongs to `Tenant`; referenced by `CarVariant.transmissionId`; seeded from `CarTransmissionType`. |
| Fuel type | `VehicleFuelType` | `vehicle_fuel_types` | `id`, `tenantId`, `name`, `normalizedName`, `localizedNames`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` | `code`, `description` | Belongs to `Tenant`; referenced by `CarVariant.fuelTypeId`; seeded from `CarFuelType`. |
| Body type | `VehicleBodyType` | `vehicle_body_types` | `id`, `tenantId`, `name`, `normalizedName`, `localizedNames`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` | `code`, `description` | Belongs to `Tenant`; referenced by `CarVariant.bodyTypeId`; seeded from `CarBodyType`. |
| Condition | `VehicleCondition` | `vehicle_conditions` | `id`, `tenantId`, `name`, `normalizedName`, `localizedNames`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` | `code`, `description` | Belongs to `Tenant`; referenced by `CarListing.conditionId`; seeded from `CarListingCondition`. |

## User And Role Entities

| Frontend contract | Prisma model | Table | Required safe fields | Excluded fields |
| --- | --- | --- | --- | --- |
| Authenticated user | `User` | `users` | `id`, `tenantId`, `email`, `displayName`, `phone`, `avatarUrl`, `isActive`, `twoFactorEnabled`, `twoFactorRequired`, `lastLoginAt`, timestamps, role names, permission actions | `passwordHash`, session token hashes, CSRF hashes, TOTP secrets, backup codes, reset OTPs, failed login count, lockout internals |
| Role membership | `Role` + `UserRole` | `roles`, `user_roles` | `Role.id`, `Role.name`, `Role.description`, `Role.isSystem`, `UserRole.userId`, `UserRole.roleId`, `UserRole.tenantId`, `UserRole.assignedAt` | No secrets are stored in role tables |
| Audit event | `RbacAuditEvent` | `rbac_audit_events` | `tenantId`, `actorUserId`, `action`, `targetType`, `targetId`, sanitized metadata, `createdAt` | Metadata keys matching password, hash, token, OTP, secret, backup, CSRF, or session |

## Runtime Rules

- Admin vehicle definition APIs must authorize the current authenticated user as `admin`, `system-owner`, or equivalent `showroom.admin.manage` permission before reading or mutating data.
- All vehicle definition queries must include `tenantId`.
- Hard delete must be blocked or converted to deactivate when records are referenced by listings or child definitions.
- Dropdowns for make, model, trim, engine, transmission, fuel type, body type, and condition must be populated from these tables or fail schema compatibility validation.
- Localized labels should read `localizedNames[activeLocale]` when available and fall back to `name`.

## Migration Checklist

1. Update this mapping when any listed model, field, mapped column, or relationship changes.
2. Update DTOs in `src/app/core/**` and server mappers in `src/server/**`.
3. Run `pnpm run schema:validate-vehicle-contract`.
4. Run `pnpm run prisma:validate` and `pnpm run prisma:generate`.
5. Update English and Arabic translation keys when visible labels, errors, or states change.
6. Run affected unit, server, E2E, translation parity, and accessibility checks.

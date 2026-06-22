# Auth And RBAC Persistence

## Source Of Truth

Angular auth state is centralized in `AuthSignalStore`. The store owns the sanitized session, current user, normalized role names, derived `isAdmin`, `isSystemOwner`, and `canAccessAdmin` flags, status, errors, storage hydration metadata, and the last role refresh timestamp.

Components and guards should use `AuthFacade` instead of parsing roles directly. Admin navigation and route guards use `canAccessAdmin`, which grants access for normalized `admin` and `system-owner` roles or the `showroom.admin.manage` permission.

## Invitation Onboarding Contract

Invitation onboarding uses the existing Prisma models without new tables:

- `UserInvitation`: `tenantId`, `email`, `normalizedEmail`, `displayName`, `tokenHash`, `targetRoles`, `status`, `expiresAt`, `acceptedAt`, `revokedAt`, `resentAt`, `inviterUserId`, `resultingUserId`, `createdAt`, and `updatedAt`.
- `User`: `tenantId`, `email`, `displayName`, `passwordHash`, optional `phone`, `isActive`, `passwordChangedAt`, and existing auth lifecycle fields that must be preserved unless the onboarding payload changes them.
- `Role`: `tenantId`, `id`, `name`, `description`, and `isSystem`, used to revalidate invitation target role IDs before acceptance.
- `UserRole`: `tenantId`, `userId`, `roleId`, and `assignedAt`, upserted through the tenant-aware uniqueness key.
- `RbacAuditEvent`: `tenantId`, optional `actorUserId`, `action`, `targetType`, `targetId`, sanitized `metadata`, and `createdAt`.

The canonical admin invitation API is `/api/admin/rbac/invitations` for listing, creation, resend, and revoke. The canonical unauthenticated onboarding API is `/api/auth/invitations/lookup` and `/api/auth/invitations/accept`; the old public acceptance path under the admin RBAC router is not used. Admin invitation DTOs expose safe status, timestamp, role, inviter, resulting-user, and action-eligibility fields, and never expose token hashes, raw invitation tokens, password hashes, OTPs, TOTP secrets, backup codes, session tokens, or CSRF hashes.

## Browser Storage

`AuthPersistenceService` persists only sanitized authenticated session state. The default storage mode is `sessionStorage`; `localStorage` is available only by explicitly setting `environment.auth.stateStorage` to `localStorage`.

Configure storage in the active environment file:

```ts
auth: {
  stateStorage: 'sessionStorage',
  stateStorageKey: 'car-showroom.auth-state',
}
```

Persisted state contains:

- session status and expiry
- sanitized user identity
- tenant context
- role names and permissions approved by the server DTO
- persistence timestamp

Persisted state must not contain:

- passwords or password hashes
- session tokens or token hashes
- CSRF tokens or hashes
- TOTP secrets, pending TOTP secrets, backup codes, reset OTPs
- failed login counts or lockout internals

## Lifecycle Synchronization

Login, registration, current-session restore, session refresh, role refresh, and two-factor completion all write the sanitized session to storage and update the store. Logout, global logout, anonymous session responses, and unauthorized restore/refresh failures reset the store, clear selected tenant context, and remove persisted auth state from both `sessionStorage` and `localStorage`.

On app start, `loadSession()` hydrates from browser storage first so route guards and shell UI can react immediately, then reconciles with `/api/auth/session`. The server response remains authoritative and overwrites stale persisted role state.

## Token Guidance

Prefer httpOnly secure cookies for session tokens. Do not store bearer tokens or long-lived session secrets in `localStorage`. If a future flow requires browser-readable tokens, use `sessionStorage`, keep lifetimes short, rotate on refresh, and clear state on every 401/403 that indicates session invalidation.

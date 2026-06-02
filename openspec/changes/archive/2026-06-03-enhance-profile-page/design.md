## Context

The app already has authenticated session APIs under `src/server/auth/**`, an Angular auth store under `src/app/core/auth/**`, and a protected `/client/profile` route. The current route loads `ClientShell`, which shows generic static workspace metrics rather than a real account profile. The Prisma `User` model already contains the fields needed for a useful profile preview: `displayName`, `email`, `phone`, `avatarUrl`, `isActive`, 2FA flags, `lastLoginAt`, `createdAt`, `updatedAt`, tenant relation, and user roles.

This change should make `/client/profile` feel like a finished account surface while keeping direct PostgreSQL reads on the server and showing only sanitized data in Angular.

## Goals / Non-Goals

**Goals:**
- Add a dedicated authenticated profile page under `src/app/features/client/**`.
- Display real sanitized user data from the PostgreSQL `users` table and related tenant/role records.
- Keep Prisma access inside `src/server/**` and expose profile data through same-origin HTTP DTOs.
- Use existing auth/session state where practical, while adding richer profile fields such as account timestamps and active status.
- Improve profile page visual design with responsive summary, contact, security, tenant, and account metadata sections.
- Add English/Arabic translations and RTL-safe layout behavior.
- Add focused tests for server DTO mapping, protected route behavior, UI states, and translation parity.

**Non-Goals:**
- Editing profile fields, changing password, avatar upload, email/phone verification, tenant switching, or deleting the account.
- New database tables or required migrations.
- Replacing the existing two-factor page; the profile page may link to it.
- Exposing sensitive auth internals such as password hash, TOTP secrets, backup codes, session tokens, CSRF hashes, failed login count, or lockout implementation details.

## Decisions

1. Add a dedicated profile DTO endpoint instead of making Angular query RBAC user APIs.

   The server will expose a current-user profile shape using the authenticated session cookie. It can live in `src/server/auth/**` as `/api/auth/profile` because the data is account/session-centric, or in a tiny `src/server/profile/**` module if separation reads better during implementation. The DTO will include only safe fields needed by the page.

   Alternatives considered:
   - Use the RBAC `UserService`: rejected because profile is the current user's account surface, not tenant user administration.
   - Put every profile field into `/api/auth/session`: possible, but the existing session DTO is intentionally compact; a dedicated profile endpoint avoids bloating every session load.

2. Read profile data from the `users` table through the current session identity.

   The profile service will resolve the current session, load the user with tenant and role names, and map it to a DTO. It will never accept an arbitrary user ID from the browser for the profile read, so clients cannot ask for another user's profile.

   Alternatives considered:
   - Passing `userId` in the URL: rejected because the route is "my profile" and should be bound to the authenticated session.
   - Reusing only the existing auth store user object: insufficient because it currently omits account metadata such as created/updated/last login and active status.

3. Keep profile state close to the profile feature unless it becomes globally useful.

   The profile page can fetch its DTO through a small `ProfileApiService` or an `AuthApiService.profile()` method. It may keep loading/error state locally with Angular signals. A global store should be added only if multiple pages need the richer profile DTO.

   Alternatives considered:
   - Add another NgRx Signal Store immediately: unnecessary for a single read-only page.
   - Patch the existing auth store with every profile field: risks making session state heavier and more mutation-prone.

4. Use a professional account dashboard composition, not another generic card grid.

   The page will have a compact identity header with avatar/initials, display name, email, account status, and primary actions. Below it, use clear sections for contact info, tenant/roles, security state, and account timeline. The design should use existing PrimeNG modules and app CSS tokens, with icons where useful and no nested-card clutter.

   Alternatives considered:
   - Keep `ClientShell` and add a few fields: rejected because profile needs a distinct layout and route purpose.
   - Create a marketing-style hero: rejected because this is an operational account surface.

5. Use localized fallback values for nullable fields.

   Phone/avatar/last-login can be missing. The page will render translated fallback labels such as "Not provided" without exposing `null` or empty strings. Dates should use existing date-format utilities where possible.

   Alternatives considered:
   - Hide missing fields entirely: rejected because a profile preview should make account completeness visible.

## Risks / Trade-offs

- Profile endpoint duplicates some session data -> Keep the DTO mapper small and share mapping helpers if that reduces duplication without tangling session and profile concerns.
- Sensitive fields leak through eager Prisma includes -> Use explicit DTO mapping and never return raw Prisma user objects from route handlers.
- Profile becomes stale after account changes elsewhere -> Load on page entry and optionally refresh after returning from security/profile-adjacent flows.
- No edit workflow frustrates users expecting account management -> Provide clear read-only preview and links to existing security/settings pages; keep edit workflows as future changes.
- RTL/profile text can crowd metadata cards -> Use mobile-first layout, wrapping metadata rows, and translated fallback text verified at narrow widths.

## Migration Plan

1. Add server profile DTO mapping and authenticated profile read route with tests.
2. Add Angular profile models/service and route `/client/profile` to a dedicated profile component.
3. Build the profile page layout, states, translations, responsive styles, and links to existing security/settings flows.
4. Add unit/integration tests and translation parity coverage.
5. Verify `npm run prisma:validate`, `npm run build:prod`, and `npm test -- --watch=false`.

Rollback strategy:
- Revert the route to `ClientShell` if the profile page must be disabled.
- Keep the profile endpoint harmlessly in place or unregister it; no database rollback is required because no schema migration is planned.

## Open Questions

- Should the profile page show role names exactly as stored (`guest`, `admin`) or map them to translated display labels?
- Should inactive accounts ever reach the profile page, or should the existing session resolver continue treating inactive users as anonymous?
- Should profile data refresh automatically after visiting the security page, or only when the profile page is reloaded?

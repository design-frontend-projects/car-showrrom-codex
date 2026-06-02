## Why

The current authenticated profile route reuses the generic client shell and does not show real account data, which makes the logged-in experience feel unfinished and untrustworthy. A polished profile page backed by the `users` table gives clients a clear account preview while preserving the server-only database boundary already used by authentication.

## What Changes

- Add a dedicated profile page under the client feature area instead of routing `/client/profile` to the generic client shell.
- Add a server-backed profile read endpoint or extend the session/profile DTO so the page displays sanitized real data from the `users` table.
- Show trusted profile fields such as display name, email, phone, avatar URL, tenant, roles, account status, 2FA state, last login, created date, and updated date when available.
- Design a more professional responsive profile layout with summary header, identity/contact cards, security/account metadata, and clear loading, empty, unauthorized, and error states.
- Keep Prisma and direct `users` table access in `src/server/**`; Angular consumes typed DTOs through existing HTTP/auth services.
- Add English and Arabic translations for profile labels, status chips, errors, and empty/fallback values.
- Add tests for protected route behavior, server DTO shaping, auth store/service integration, and translation key parity.
- Non-goals: password change forms, full account editing, avatar upload, email/phone verification flows, tenant switching, and 2FA management beyond linking to existing security workflows.

## Capabilities

### New Capabilities
- `client-profile-page`: Covers the authenticated profile page, real user data preview, profile route behavior, loading/error states, and responsive profile UI.

### Modified Capabilities
- `server-database-access`: Add a server-only profile data boundary that reads sanitized user account fields from PostgreSQL without exposing Prisma to Angular.
- `rbac-api-client-state`: Add authenticated profile data consumption through existing session/RBAC-aware client state and protected route handling.
- `bilingual-rtl-localization`: Add English/Arabic profile labels, status text, fallback values, errors, and RTL-safe profile content.
- `responsive-layout-signals`: Add responsive behavior for profile summary, cards, metadata grids, and compact mobile presentation.
- `uber-inspired-ui-system`: Add a polished client profile composition that follows the existing visual system and interaction states.

## Impact

- Affected server files: `src/server/auth/**` or a new `src/server/profile/**` module, server DTO mapping, profile validation/error helpers, and route registration in `src/server.ts` if a new route module is used.
- Affected Angular files: `src/app/features/client/client.routes.ts`, a new profile component under `src/app/features/client/**`, `src/app/core/auth/**` or a profile-specific core service/store, and shared formatting utilities if needed.
- Affected data model: no required schema migration is expected because the needed profile fields already exist on `User`; Prisma generation should remain unchanged unless DTO requirements reveal a missing field.
- Affected localization/docs/tests: `public/i18n/en.json`, `public/i18n/ar.json`, translation parity tests, auth/profile route tests, and feature README notes if profile behavior is documented.
- Verification should keep `npm run prisma:validate`, `npm run build:prod`, and `npm test -- --watch=false` passing.

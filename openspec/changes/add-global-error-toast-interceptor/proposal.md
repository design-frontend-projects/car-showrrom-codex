## Why

Backend failures currently reach feature code without a consistent app-wide presentation path. Users need a single, localized toast experience for server-side errors so API failures are visible and understandable in both English and Arabic.

## What Changes

- Add a global Angular HTTP interceptor for backend error responses.
- Extract a user-facing message from the backend error payload using a predictable fallback order.
- Display extracted backend errors with the existing PrimeNG Toast service.
- Resolve backend messages that include a `transKey` flag through local ngx-translate JSON files before showing the toast.
- Keep non-backend, non-browser, and intentionally handled errors from causing duplicate global toasts.
- Add focused unit coverage for raw messages, translated `transKey` messages, and fallback behavior.

## Capabilities

### New Capabilities
- `global-error-toasts`: App-wide HTTP error handling that extracts backend messages and displays PrimeNG toast notifications.

### Modified Capabilities
- `bilingual-rtl-localization`: Backend error payloads marked with `transKey` SHALL resolve through the active local i18n JSON before display.

## Impact

- Affected Angular code: `src/app/core/interceptors`, `src/app/app.config.ts`, and the root shell template where the PrimeNG Toast host is mounted if needed.
- Affected i18n assets: `public/i18n/en.json` and `public/i18n/ar.json` for any new global error fallback keys.
- Affected tests: interceptor unit tests and i18n key parity coverage.
- No database, Prisma, server route, or API contract migrations are required.
- Non-goals: replacing feature-specific inline validation, changing backend error schemas, or adding remote translation loading.

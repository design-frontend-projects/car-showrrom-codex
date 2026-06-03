# Localization And Schema Migration

## Adding Languages

Translation files live in `public/i18n`. Add a new locale by copying `en.json`, translating every static key, registering the language in the preferences UI if needed, and running the i18n parity test. New admin definition labels, validation messages, dialogs, toasts, access-denied states, and screen-reader announcements must be translated before the UI is accepted.

English and Arabic must keep identical key paths. The existing parity test compares flattened key paths across `public/i18n/en.json` and `public/i18n/ar.json`.

## Dynamic Catalog Labels

Vehicle catalog records expose stable identifiers, canonical `name`, normalized search fields, and optional `localizedNames`. Dropdowns and tables should display `localizedNames[activeLocale]` when present. If the localized label is missing, fall back to the canonical `name`; never show raw translation keys for database content.

## RTL Layout Checks

Admin definition screens must work in LTR and RTL. When adding fields or actions, verify narrow and desktop widths for search controls, tables, dialogs, dropdowns, focus outlines, and destructive-action confirmations. Controls must wrap without horizontal overflow.

## Schema Migration Checklist

When vehicle definition or RBAC schema changes affect frontend contracts:

1. Update `docs/vehicle-schema-contract.md` with exact Prisma model, table, field, type, optionality, and relationship changes.
2. Update `scripts/validate-vehicle-schema.mjs` if frontend expectations changed.
3. Add or update Prisma migrations and seed/backfill logic.
4. Run `pnpm run schema:validate-vehicle-contract`.
5. Run `pnpm run prisma:validate` and `pnpm run prisma:generate`.
6. Update server DTOs, validation schemas, repositories, cache invalidation, and audit metadata.
7. Update Angular DTOs, API services, forms, dropdown dependencies, and route guards when needed.
8. Update English and Arabic translation keys for any visible label, status, error, dialog, or announcement.
9. Run affected unit, server, translation parity, accessibility, E2E, and production build checks.

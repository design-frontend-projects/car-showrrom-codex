## Why

Users need direct control over visual comfort and language direction from the primary navigation, especially now that the showroom UI has a stronger visual system. Adding theme and language switchers makes the app usable in light, dark, system-preferred, English, and Arabic contexts without requiring separate routes or settings screens.

## What Changes

- Add right-side navbar controls for theme mode selection: `light`, `dark`, and `system`.
- Persist the selected theme mode and apply the effective mode to the whole Angular app, including PrimeNG components through the existing `.app-dark` dark mode selector.
- Add right-side navbar language toggle between English and Arabic.
- Add `public/i18n/ar.json` with the same key shape as `public/i18n/en.json`, translated to Arabic.
- Apply app-wide `lang` and `dir` attributes for English LTR and Arabic RTL, and ensure the shell, navigation, cards, forms, dialogs, drawer, map picker, and workspace views render correctly in RTL.
- Preserve SSR compatibility by using deterministic defaults before browser-only preferences such as `localStorage` and `matchMedia` are available.
- Non-goal: this change does not add route-level localized URLs, user-account preference persistence on the backend, or database schema changes.

## Capabilities

### New Capabilities
- `appearance-mode-switching`: Defines light, dark, and system theme selection, persistence, effective-mode application, and navbar controls.
- `bilingual-rtl-localization`: Defines English/Arabic language switching, Arabic translation parity, app-wide direction handling, and RTL layout requirements.

### Modified Capabilities

## Impact

- Affected app areas: `src/app/layout/app-shell/**`, `src/styles.css`, `src/app/app.config.ts`, `src/app/state/**` or `src/app/core/**` for preference services/stores, and shared/feature styles that need logical spacing or RTL overrides.
- Translation assets: add `public/i18n/ar.json` and keep it key-compatible with `public/i18n/en.json`.
- Browser APIs: use `localStorage` and `matchMedia` only behind browser-safe guards for SSR compatibility.
- Dependencies: no new package is expected; use existing Angular signals, ngx-translate, PrimeNG, and browser APIs.
- API and database impact: none; Angular browser code must continue to avoid Prisma, `@prisma/adapter-pg`, and `pg` imports.
- Verification impact: test theme preference mapping, translation key parity, language/RTL state, production build, and browser views in LTR/RTL plus light/dark/system modes.

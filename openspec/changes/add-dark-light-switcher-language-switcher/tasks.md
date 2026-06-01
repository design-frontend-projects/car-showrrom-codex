## 1. Preference State Foundation

- [ ] 1.1 Define theme mode, effective theme, language, and direction models/constants.
- [ ] 1.2 Implement a root-provided preference service or Signal Store with signals for selected theme mode, effective theme, selected language, and direction.
- [ ] 1.3 Add browser-safe persistence for theme mode and language using `localStorage` with deterministic SSR fallbacks.
- [ ] 1.4 Add browser-safe system theme observation using `matchMedia('(prefers-color-scheme: dark)')` and cleanup-safe listeners.

## 2. App Initialization And Document Integration

- [ ] 2.1 Initialize preferences during app startup without breaking Angular SSR or hydration.
- [ ] 2.2 Apply `.app-dark`, `data-theme-mode`, and `data-theme` to the document root based on selected and effective theme.
- [ ] 2.3 Apply document `lang` and `dir` attributes for English LTR and Arabic RTL.
- [ ] 2.4 Connect the selected language to `TranslateService.use(...)` and keep fallback language behavior intact.

## 3. Navbar Controls

- [ ] 3.1 Add right-side topbar theme mode control for `light`, `dark`, and `system`.
- [ ] 3.2 Add right-side topbar language toggle for English and Arabic.
- [ ] 3.3 Keep the controls keyboard-accessible, labeled for assistive technology, and visible/focusable in mobile, tablet, and desktop layouts.
- [ ] 3.4 Add drawer or compact fallbacks if mobile topbar spacing becomes too tight.

## 4. Arabic Translation Asset

- [ ] 4.1 Create `public/i18n/ar.json` with the same nested key shape as `public/i18n/en.json`.
- [ ] 4.2 Translate every existing English value in `en.json` to Arabic, including nested page arrays.
- [ ] 4.3 Add tests or a verification utility that compares `en.json` and `ar.json` key paths for parity.
- [ ] 4.4 Update or add UI labels for new theme and language controls in both translation files.

## 5. Dark Mode Styling

- [ ] 5.1 Add dark-mode CSS tokens and overrides for page surfaces, text, borders, cards, forms, dialogs, drawers, menus, map picker, and Driver.js popovers.
- [ ] 5.2 Ensure PrimeNG components respond to the existing `.app-dark` selector.
- [ ] 5.3 Verify light and dark modes preserve readable contrast, visible focus states, and disabled-state readability.

## 6. RTL Layout Styling

- [ ] 6.1 Audit app-shell, global styles, shared components, landing pages, admin/client workspaces, forms, and map picker for hard-coded left/right layout assumptions.
- [ ] 6.2 Convert direction-sensitive spacing and positioning to logical CSS properties where practical.
- [ ] 6.3 Add targeted `[dir='rtl']` overrides for icon order, chevrons, drawer behavior, animations, or map/search controls where logical properties are insufficient.
- [ ] 6.4 Verify Arabic RTL rendering has no horizontal overflow at 320px mobile, tablet, and desktop widths.

## 7. Tests And Verification

- [ ] 7.1 Add focused tests for theme mode selection, system effective theme mapping, and document class/attribute application.
- [ ] 7.2 Add focused tests for language selection, persistence fallback, document `lang`/`dir`, and translation key parity.
- [ ] 7.3 Run `npm test -- --watch=false` and address relevant failures.
- [ ] 7.4 Run `npm run build:prod` and address relevant build or SSR issues.
- [ ] 7.5 Browser-verify English/Arabic plus light/dark/system modes across landing, catalog, contact/map, auth dialog, drawer, admin, and client views.
- [ ] 7.6 Confirm browser code still does not import Prisma, `@prisma/adapter-pg`, or `pg`, and no database/API files changed for this UI-only scope.

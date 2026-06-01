## Context

Car Showroom is an Angular 22 RC SSR app using standalone components, PrimeNG, Tailwind CSS v4, ngx-translate, and Angular signals. The app already configures PrimeNG with `darkModeSelector: '.app-dark'`, uses translation JSON files from `public/i18n/*.json`, and renders primary navigation in `src/app/layout/app-shell/**`.

The requested change crosses shell UI, global document state, translations, and CSS direction handling. It should build on the existing responsive shell and visual system without changing routes, server APIs, Prisma, or authentication behavior.

## Goals / Non-Goals

**Goals:**
- Add right-side navbar controls for theme mode and language switching.
- Support `light`, `dark`, and `system` theme modes with persisted preference and effective mode application.
- Support English and Arabic language switching with persisted preference.
- Add `public/i18n/ar.json` with complete key parity against `public/i18n/en.json`.
- Apply `lang`, `dir`, and RTL-aware layout behavior to the whole app.
- Keep SSR deterministic and avoid browser-only APIs during server rendering.

**Non-Goals:**
- No route-localized URLs such as `/ar/...`.
- No backend storage of preferences.
- No database, Prisma migration, or Express API changes.
- No replacement of ngx-translate, PrimeNG, Tailwind CSS, or the current app shell.

## Decisions

1. Store user preferences in a root-provided Angular service or Signal Store.

   The implementation should expose signals for `themeMode`, `effectiveTheme`, `language`, and `direction`. It should persist preferences in `localStorage` when running in the browser and provide deterministic defaults on the server.

   Alternative considered: keep state local to `AppShell`. That would make document attributes, bootstrap defaults, tests, and future reuse harder to coordinate.

2. Apply theme through document classes and attributes.

   The effective dark mode should add `.app-dark` to the document root so PrimeNG follows the existing configured selector. The implementation should also expose useful attributes such as `data-theme-mode` and `data-theme` for app CSS.

   Alternative considered: configure separate PrimeNG presets at runtime. That is heavier and unnecessary because the project already uses `.app-dark`.

3. Implement system mode with `matchMedia('(prefers-color-scheme: dark)')`.

   `system` mode should listen for media-query changes in the browser and update effective theme without changing the selected user preference. Server rendering should default to light or another deterministic fallback until browser hydration applies the actual preference.

   Alternative considered: only read system preference once. That would fail the expected behavior when OS appearance changes while the app is open.

4. Apply language with ngx-translate and document metadata.

   The preference service should call `TranslateService.use(language)` and update `document.documentElement.lang` plus `document.documentElement.dir`. English maps to `ltr`; Arabic maps to `rtl`.

   Alternative considered: rely on CSS classes without document `dir`. Native browser direction support is more robust for inputs, text flow, and accessibility.

5. Keep navbar controls compact, accessible, and responsive.

   The right side of the shell should include a theme segmented/menu control for `light`, `dark`, and `system`, plus an English/Arabic toggle. On mobile, the controls may remain in the topbar if space allows and may also be represented in the drawer when needed for ergonomic access.

   Alternative considered: put controls only in the drawer. That would hide desktop and tablet preferences behind unnecessary navigation.

6. Use logical CSS properties for RTL-sensitive layout.

   Update shared and component styles to prefer logical properties such as `padding-inline`, `margin-inline`, `border-inline`, `inset-inline-start`, and `text-align: start/end` where direction matters. Add targeted `[dir='rtl']` overrides only for icons, animations, or ordering that cannot be expressed logically.

   Alternative considered: duplicate large CSS blocks for RTL. That would be brittle and make future UI work harder.

## Risks / Trade-offs

- Browser preferences can conflict with SSR fallback during hydration -> use deterministic defaults and update document state as early as practical in app initialization.
- Translation files can drift -> add a parity test or utility check ensuring `ar.json` and `en.json` have identical key paths.
- RTL may expose hard-coded left/right CSS -> audit shared/layout CSS and convert affected rules to logical properties or targeted RTL overrides.
- Navbar controls can crowd small screens -> use icon-first compact controls, accessible labels, and drawer fallback if the topbar becomes too dense.
- System theme listeners can leak -> register listeners in a root service with Angular cleanup or a single long-lived effect.

## Migration Plan

1. Add preference models, constants, and a root preference service/store for theme and language state.
2. Wire app initialization to load persisted preferences, apply document attributes/classes, and configure ngx-translate.
3. Add navbar theme and language controls to `AppShell`.
4. Add `public/i18n/ar.json` translated from `en.json` with identical key shape.
5. Update CSS and affected components for dark mode tokens and RTL-safe logical spacing.
6. Add tests for preference state mapping, translation key parity, and document direction/theme application.
7. Verify English/Arabic and light/dark/system modes at mobile, tablet, and desktop sizes.

Rollback is a normal frontend code revert because no database, API, or route migration is expected.

## Open Questions

- Should the app default to `system` theme mode for first-time visitors, or default to `light` until the user chooses otherwise?
- Should the language toggle show text labels (`EN`/`AR`) only, or include icons once an appropriate local icon pattern exists?

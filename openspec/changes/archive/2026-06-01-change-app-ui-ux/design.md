## Context

Car Showroom is an Angular 22 RC SSR app with a PrimeNG and Tailwind CSS v4 UI layer. The current app already uses global design tokens in `src/styles.css`, an application shell in `src/app/layout/app-shell/**`, standalone feature pages, ngx-translate content, Driver.js tours, and NgRx Signal Store for UI state.

The requested UI work is cross-cutting: it affects shared styling, the shell, landing/catalog/content/contact pages, admin/client workspaces, auth entry points, and responsive behavior. The local `design-md/uber/README.md` points to an Uber-inspired design direction focused on bold black and white, tight type, compact spacing, urban energy, pill actions, simple cards, and an 8px spacing rhythm.

## Goals / Non-Goals

**Goals:**
- Apply a mobile-first Uber-inspired UI system across the visible Angular application.
- Normalize spacing, margins, page widths, card rhythm, and action sizing so screens feel cohesive at 320px and scale up cleanly.
- Provide a reusable responsive helper using `@angular/cdk/layout` `BreakpointObserver` and Angular signals.
- Use signals and computed values for layout decisions in app shell and feature components.
- Preserve SSR compatibility, existing route structure, i18n keys, Driver.js tour anchors, and PrimeNG component usage.

**Non-Goals:**
- No changes to Prisma schema, migrations, generated Prisma client, Express server routes, or database access.
- No new backend API, auth behavior, vehicle persistence behavior, or map SDK behavior.
- No replacement of PrimeNG or Tailwind CSS.
- No dependency addition unless implementation discovers that existing `@angular/cdk` cannot satisfy the responsive helper.

## Decisions

1. Centralize visual tokens in global CSS, then keep component CSS scoped to layout specifics.

   The implementation should update `src/styles.css` with the core tokens: monochrome palette, grays, accent color usage, radius values, shadow values, spacing custom properties, page width, and PrimeNG overrides. Component styles should consume these tokens instead of redefining unrelated colors and spacing.

   Alternative considered: define design tokens per component. That would make the refresh harder to keep consistent and increase the chance of spacing drift.

2. Keep PrimeNG, but restyle it to match the design direction.

   PrimeNG buttons, inputs, cards, dialogs, drawers, menus, and avatars should remain the component primitives. Their global and local classes should be tuned for pill actions, compact heights, black primary actions, subtle outlined states, clean cards, and predictable focus states.

   Alternative considered: replace PrimeNG primitives with custom controls. That would expand scope and risk accessibility regressions.

3. Add a dedicated signal-based responsive service/helper around Angular CDK Layout.

   Create a reusable responsive helper in the Angular browser app, likely under `src/app/core/layout/` or another existing shared location. It should inject `BreakpointObserver`, observe mobile/tablet/desktop breakpoints, convert the stream to signals using Angular interop, and expose computed values such as `isMobile`, `isTablet`, `isDesktop`, `isHandset`, and a coarse layout mode.

   Alternative considered: CSS-only media queries. CSS remains the main layout mechanism, but shell behavior like drawer mode, compact panels, and grid density needs a declarative TypeScript signal contract.

4. Use mobile-first layout composition.

   Base styles should target narrow screens first. Larger breakpoints should progressively add multi-column grids, persistent nav, broader hero layouts, wider metrics, and denser catalog cards. The shell should default to touch-friendly navigation and upgrade to desktop navigation when the responsive helper indicates enough width.

   Alternative considered: preserve desktop-first CSS and add narrower overrides. That would keep the current inversion and make mobile spacing harder to reason about.

5. Preserve route and tour anchors while changing presentation.

   The implementation should keep route paths and important IDs such as `top-navigation`, `auth-rail`, `hero-search`, `admin-shell`, and `client-shell` unless a tour update is made in the same change. Visual restructuring must not break onboarding flows.

   Alternative considered: fully restructure DOM around the new visuals. That would create avoidable onboarding and test churn.

6. Keep browser/server boundaries unchanged.

   All responsive and visual helpers belong in Angular browser-safe code under `src/app/**`. This change must not import Prisma, `@prisma/adapter-pg`, or `pg` into browser code and should not touch server-only database modules.

   Alternative considered: none; this is an existing project boundary.

## Risks / Trade-offs

- Responsive signal subscriptions could leak or duplicate breakpoint work if every component creates its own observers -> expose one root-provided helper and share its signals.
- A strong black/white visual system can become too stark for form-heavy flows -> use gray surfaces, clear focus rings, sufficient whitespace, and measured accent usage.
- Changing layout spacing can break Driver.js tour positioning -> verify tour anchors after visual updates and update tour offsets only if needed.
- SSR can render before browser viewport information is available -> provide deterministic default responsive state and allow hydration to update after CDK observes the viewport.
- Global PrimeNG overrides may affect all features -> keep overrides token-based and verify landing, catalog, admin, client, auth, dialog, drawer, and map views.

## Migration Plan

1. Add or update the responsive helper and unit tests for breakpoint-to-signal behavior.
2. Refresh global CSS tokens and PrimeNG overrides with mobile-first defaults.
3. Update `AppShell` to consume responsive signals for nav, drawer, auth rail, and compact state.
4. Update landing, catalog, content/contact, admin, client, and shared components for spacing, grid behavior, and visual consistency.
5. Verify with `npm test -- --watch=false` and `npm run build:prod`.
6. Visually check mobile, tablet, and desktop widths, including navigation, hero, cards, forms, dialogs, and tours.

Rollback is a normal code revert of frontend files because no database migration or API contract changes are expected.

## Open Questions

- Should the final implementation include local vehicle imagery assets, or continue using remote image URLs already present in the app?
- Should responsive state be stored only in a root-provided helper service, or also mirrored into `UiSignalStore` for developer tooling and future feature state?

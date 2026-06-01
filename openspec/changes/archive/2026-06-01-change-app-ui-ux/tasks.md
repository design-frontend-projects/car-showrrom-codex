## 1. Responsive Foundation

- [x] 1.1 Create a root-provided responsive helper using `@angular/cdk/layout` `BreakpointObserver` and Angular signals.
- [x] 1.2 Expose mobile, tablet, desktop, handset, and layout mode signals with deterministic SSR fallback values.
- [x] 1.3 Add focused tests or verifiable coverage for breakpoint-to-signal behavior.
- [x] 1.4 Confirm browser code does not import Prisma, `@prisma/adapter-pg`, or `pg`.

## 2. Design Tokens And Global Styling

- [x] 2.1 Refresh `src/styles.css` tokens for the Uber-inspired monochrome palette, gray surfaces, line colors, accent usage, radius, shadow, spacing, and content width.
- [x] 2.2 Update global PrimeNG overrides for buttons, inputs, cards, dialogs, drawers, menus, avatars, focus states, disabled states, and touch-friendly sizing.
- [x] 2.3 Convert global page composition CSS to mobile-first defaults with progressive tablet and desktop breakpoints.
- [x] 2.4 Verify 320px-wide screens have no horizontal scrolling or overlapping text in shared layout primitives.

## 3. Application Shell

- [x] 3.1 Update `AppShell` to consume responsive signals for mobile drawer mode, desktop navigation mode, compact auth presentation, and route layout density.
- [x] 3.2 Refresh `app-shell.html` and `app-shell.css` with mobile-first spacing, brand hierarchy, nav actions, drawer layout, auth rail behavior, and desktop enhancements.
- [x] 3.3 Preserve important route and tour anchors including `top-navigation` and `auth-rail`.
- [x] 3.4 Verify authenticated and guest shell states render cleanly on mobile, tablet, and desktop.

## 4. Feature UI Refresh

- [x] 4.1 Refresh the landing hero, search area, featured vehicle panel, and quick category grid with the shared design rhythm.
- [x] 4.2 Refresh catalog pages so vehicle cards, media, metadata, and actions scale from single-column mobile to dense desktop grids.
- [x] 4.3 Refresh content, contact, map, and form layouts for consistent spacing, readable type, and mobile-first stacking.
- [x] 4.4 Refresh admin and client workspace pages so page headers and metric cards follow the updated type scale, surfaces, and responsive grid behavior.
- [x] 4.5 Refresh shared components such as register form and map picker only where needed for visual consistency and accessibility.

## 5. Responsive Signal Usage

- [x] 5.1 Use computed values from the responsive helper where TypeScript decisions are needed for shell behavior or feature density.
- [x] 5.2 Keep simple visual wrapping and spacing in CSS media queries rather than duplicating layout rules in TypeScript.
- [x] 5.3 Ensure responsive state updates after browser hydration without SSR errors or layout crashes.

## 6. Verification

- [x] 6.1 Run `npm test -- --watch=false` and address relevant failures.
- [x] 6.2 Run `npm run build:prod` and address relevant build or SSR issues.
- [x] 6.3 Visually verify landing, catalog, contact, admin, client, auth dialog, drawer, and onboarding tour anchors at mobile, tablet, and desktop widths.
- [x] 6.4 Confirm no database, Prisma migration, Express route, or backend API files changed for this UI-only scope.

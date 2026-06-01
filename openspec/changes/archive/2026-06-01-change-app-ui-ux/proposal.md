## Why

The current showroom UI has a solid Angular/PrimeNG foundation, but the visual language and responsive behavior need a more deliberate mobile-first system so landing, catalog, admin, auth, and shared flows feel cohesive across phones, tablets, and desktop. Adopting the Uber-inspired design direction gives the app a sharper showroom experience: bold monochrome contrast, tighter hierarchy, purposeful spacing, and efficient navigation.

## What Changes

- Introduce an Uber-inspired UI/UX refresh across the Angular app using a black/white-first palette, restrained gray surfaces, bold typography, pill actions, clean cards, and an 8px spacing rhythm.
- Rework major user-facing screens and shells for mobile-first layouts, consistent margins, responsive content widths, and predictable component spacing.
- Add a reusable Angular CDK Layout responsive helper built on `BreakpointObserver` and Angular signals so components can consume viewport state declaratively.
- Use signals and computed values for responsive UI state such as mobile nav mode, compact panels, grid density, and breakpoint-aware layout decisions.
- Preserve the existing Angular SSR, PrimeNG, Tailwind CSS v4, ngx-translate, Driver.js onboarding, auth, and routing boundaries.
- Non-goal: this change does not alter Prisma schema, server routes, authentication semantics, vehicle data models, or backend APIs.

## Capabilities

### New Capabilities
- `uber-inspired-ui-system`: Defines the showroom visual system, spacing, typography, components, and page composition expected from the Uber-inspired design direction.
- `responsive-layout-signals`: Defines mobile-first responsive behavior using Angular CDK Layout, `BreakpointObserver`, and signal-based helpers for components and shells.

### Modified Capabilities

## Impact

- Affected app areas: `src/styles.css`, `src/app/layout/app-shell/**`, `src/app/features/landing/**`, `src/app/features/admin/**`, `src/app/features/client/**`, and reusable components under `src/app/shared/**`.
- New or updated frontend helpers may live under `src/app/utils/**`, `src/app/core/**`, or `src/app/state/**` depending on the current local pattern for singleton versus pure utility code.
- Dependency impact: use the existing `@angular/cdk` package for layout observation; no new package is expected unless implementation discovers a gap.
- API and database impact: none expected; browser code must continue to avoid Prisma, `@prisma/adapter-pg`, and `pg` imports.
- Verification impact: run Angular unit tests and a production SSR build; visually verify desktop, tablet, and mobile breakpoints.

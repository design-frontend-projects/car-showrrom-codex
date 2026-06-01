# Car Showroom

Angular 22 RC SSR scaffold for a modular car showroom application. The stack uses PrimeNG, PrimeIcons, Tailwind CSS v4, NgRx Store/Effects/Router Store, NgRx Signals, Angular signal forms, ngx-translate, Driver.js, and Temporal utilities.

## Requirements

- Node `^22.22.3`, `^24.15.0`, or `>=26.0.0`.
- npm `11.x`.
- Angular packages are pinned to `22.0.0-rc.2`.
- `.npmrc` enables `legacy-peer-deps=true` while PrimeNG and NgRx publish Angular 21 peer ranges.

If the machine Node is older than the Angular 22 RC engine range, run commands through:

```bash
npx -p node@24.15.0 -p npm@11.6.2 npm run build
```

## Scripts

- `npm start` runs the dev server.
- `npm run build:dev` builds with dev environment replacements.
- `npm run build:test` builds with test environment replacements.
- `npm run build:prod` builds with prod environment replacements and SSR output.
- `npm test` runs unit tests.
- `npm run serve:ssr:car-showroom` runs the built SSR server.

## Architecture

- `src/app/core` contains singleton services, auth, HTTP, interceptors, logging, and onboarding.
- `src/app/features` contains landing, admin, and client modules.
- `src/app/layout` contains the top nav, auth sidebar, mobile drawer, and route animation shell.
- `src/app/state` contains NgRx global state and NgRx Signal Store UI state.
- `src/app/utils` contains reusable date, number, text, file, image, and signal-form helpers.
- `public/i18n` contains ngx-translate JSON files.

## Deployment

Build the SSR container and run it behind Nginx:

```bash
docker compose up --build
```

Nginx listens on `http://localhost:8080`, load-balances two Node SSR containers, and applies cache headers to static assets.

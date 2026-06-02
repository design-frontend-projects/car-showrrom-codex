## 1. Interceptor Implementation

- [x] 1.1 Create a global error interceptor under `src/app/core/interceptors` that catches `HttpErrorResponse`, extracts backend messages, resolves `transKey` values through ngx-translate, emits PrimeNG error toasts in the browser, and rethrows the original error.
- [x] 1.2 Register the global error interceptor in the app-wide HTTP interceptor chain without disrupting existing auth and logging behavior.

## 2. Toast Host and Translations

- [x] 2.1 Ensure one root PrimeNG Toast host is mounted so global messages render across routes.
- [x] 2.2 Add any required English and Arabic fallback translation keys while preserving i18n key parity.

## 3. Verification

- [x] 3.1 Add focused unit tests for plain backend messages, translated `transKey` messages, fallback messages, browser-only emission, and original error propagation.
- [x] 3.2 Run the relevant test and build checks for the changed Angular code.

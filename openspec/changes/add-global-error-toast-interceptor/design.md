## Context

The Angular app already uses functional HTTP interceptors, ngx-translate with local JSON files under `public/i18n`, and PrimeNG's `MessageService`. The current interceptor chain handles auth headers, 401 routing, and optional HTTP logging, but it does not provide one shared user-facing path for backend errors.

This change is cross-cutting because every browser HTTP request can fail, the handler must respect SSR boundaries, and translated error keys must use the existing local i18n setup instead of introducing a second translation source.

## Goals / Non-Goals

**Goals:**
- Add one global functional HTTP interceptor that observes backend `HttpErrorResponse` values.
- Extract an error message from common backend shapes while retaining a safe localized fallback.
- Display errors through PrimeNG Toast using the existing `MessageService`.
- Resolve payloads marked with `transKey` through ngx-translate before displaying the toast.
- Register the interceptor in the app-wide HTTP provider chain and verify it with focused unit tests.

**Non-Goals:**
- Change backend error response schemas.
- Replace inline form validation or field-level API validation handling.
- Persist error notifications, add retry orchestration, or add remote translation loading.
- Add database, Prisma, Express route, or API migration changes.

## Decisions

1. Use a functional interceptor in `src/app/core/interceptors`.

   Rationale: The app already uses Angular functional interceptors for auth and logging, so the global error handler can follow the same registration model and dependency injection style.

   Alternative considered: A class-based interceptor. This would work but would add a different interceptor style without a benefit for this use case.

2. Restrict toast display to the browser platform.

   Rationale: SSR should not attempt to show UI notifications and must not rely on browser-only PrimeNG overlay behavior. The interceptor should still rethrow the original error on every platform.

   Alternative considered: Register the interceptor only in browser-specific configuration. Keeping it registered globally with an explicit browser guard keeps provider configuration simpler and makes behavior easier to test.

3. Extract backend messages with a tolerant payload parser.

   Rationale: Backend errors can appear as `error.message`, `error.error.message`, string bodies, arrays of messages, or fetch/network failures. The parser should prefer explicit backend message fields and fall back to a local generic error key.

   Alternative considered: Require a single canonical backend error shape. That is cleaner long term, but this request should not change the server API contract.

4. Resolve `transKey` payloads through ngx-translate synchronously when possible.

   Rationale: Translation JSON is already loaded by ngx-translate, and `TranslateService.instant` provides deterministic interceptor behavior without adding asynchronous side effects to the error stream. If a key is unavailable, the handler falls back to the extracted message or a generic local fallback.

   Alternative considered: Use `translate.get()` and delay error propagation until the translation observable resolves. That risks changing HTTP error timing and makes interceptor behavior harder for callers to reason about.

5. Mount one PrimeNG Toast host at the root shell if the app does not already have one.

   Rationale: PrimeNG messages emitted by `MessageService` need a toast component in the rendered app. Root placement gives all routes the same global notification surface.

   Alternative considered: Add per-feature toast hosts. That creates duplicate presentation surfaces and weakens the global handler contract.

## Risks / Trade-offs

- Duplicate toasts if feature code also shows a toast for the same error -> Keep the interceptor generic and focused; feature-specific suppression can be added later with an HTTP context token if duplicate handling becomes a real workflow issue.
- Missing translation keys could expose raw key names -> Add fallback logic and include parity coverage for new fallback keys in `en.json` and `ar.json`.
- Toasts during SSR would be ineffective or error-prone -> Guard toast emission with `isPlatformBrowser`.
- Overly broad message extraction might show technical details -> Prefer known user-facing fields and use a generic fallback when no safe message exists.

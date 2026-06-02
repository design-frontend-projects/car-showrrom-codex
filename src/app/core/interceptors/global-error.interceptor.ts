import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

const ERROR_SUMMARY_KEY = 'errors.summary';
const GENERIC_ERROR_KEY = 'errors.generic';

type ErrorPayload = Record<string, unknown>;

interface MessageCandidate {
  fallback?: string;
  key?: string;
  params?: Record<string, unknown>;
}

export const globalErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(request);
  }

  const messageService = inject(MessageService);
  const translate = inject(TranslateService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        messageService.add({
          severity: 'error',
          summary: translateOrFallback(translate, ERROR_SUMMARY_KEY, 'Error'),
          detail: resolveErrorMessage(error, translate),
        });
      }

      return throwError(() => error);
    }),
  );
};

function resolveErrorMessage(error: HttpErrorResponse, translate: TranslateService): string {
  const candidate = readMessageCandidate(error.error);

  if (candidate.key) {
    return translateOrFallback(
      translate,
      candidate.key,
      candidate.fallback ?? translateOrFallback(translate, GENERIC_ERROR_KEY, 'Something went wrong. Please try again.'),
      candidate.params,
    );
  }

  return candidate.fallback ?? translateOrFallback(translate, GENERIC_ERROR_KEY, 'Something went wrong. Please try again.');
}

function readMessageCandidate(body: unknown): MessageCandidate {
  if (typeof body === 'string' && body.trim()) {
    return { fallback: body };
  }

  if (!isPayload(body)) {
    return {};
  }

  const messagePayload = readPayload(body['message']);
  const explicitTransKey = readString(body['transKey']);

  if (explicitTransKey) {
    return { key: explicitTransKey, fallback: messagePayload.fallback, params: readParams(body) ?? messagePayload.params };
  }

  if (body['transKey'] === true) {
    const key = messagePayload.key ?? messagePayload.fallback ?? readString(body['code']);

    return { key, fallback: readString(body['fallback']), params: readParams(body) ?? messagePayload.params };
  }

  if (messagePayload.key) {
    return messagePayload;
  }

  const code = readString(body['code']);

  if (code) {
    return { key: code, fallback: readString(body['fallback']), params: readParams(body) };
  }

  const error = readString(body['error']);

  return { fallback: messagePayload.fallback ?? error };
}

function readPayload(value: unknown): MessageCandidate {
  if (typeof value === 'string' && value.trim()) {
    return { fallback: value };
  }

  if (!isPayload(value)) {
    return {};
  }

  const key = readString(value['transKey']) ?? readString(value['key']) ?? readString(value['code']);
  const fallback = readString(value['message']) ?? readString(value['fallback']);

  if (key || value['transKey'] === true) {
    return { key: key ?? fallback, fallback: value['transKey'] === true ? readString(value['fallback']) : fallback, params: readParams(value) };
  }

  return { fallback, params: readParams(value) };
}

function translateOrFallback(translate: TranslateService, key: string, fallback: string, params?: Record<string, unknown>): string {
  const translated = translate.instant(key, params);

  return typeof translated === 'string' && translated.trim() && translated !== key ? translated : fallback;
}

function readParams(value: ErrorPayload): Record<string, unknown> | undefined {
  const params = value['params'] ?? value['interpolateParams'];

  return isPayload(params) ? params : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isPayload(value: unknown): value is ErrorPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

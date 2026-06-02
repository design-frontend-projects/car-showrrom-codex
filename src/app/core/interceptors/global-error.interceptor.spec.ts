import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { throwError } from 'rxjs';
import { globalErrorInterceptor } from './global-error.interceptor';

describe('globalErrorInterceptor', () => {
  const translations: Record<string, string> = {
    'errors.summary': 'Error',
    'errors.generic': 'Something went wrong. Please try again.',
    'showroom.error.tenantRequired': 'Select a tenant before using showroom data.',
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('displays a plain backend message and rethrows the original error', () => {
    const { messageService } = configureInterceptorTest('browser');
    const error = createHttpError({ message: 'Backend validation failed.' });

    const propagated = runInterceptor(error);

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Backend validation failed.',
      }),
    );
    expect(propagated).toBe(error);
  });

  it('translates backend code fields through local i18n keys', () => {
    const { messageService } = configureInterceptorTest('browser');

    runInterceptor(createHttpError({ code: 'showroom.error.tenantRequired' }));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Select a tenant before using showroom data.',
      }),
    );
  });

  it('translates explicit transKey payloads before displaying the toast', () => {
    const { messageService } = configureInterceptorTest('browser');

    runInterceptor(createHttpError({ message: 'showroom.error.tenantRequired', transKey: true }));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Select a tenant before using showroom data.',
      }),
    );
  });

  it('uses a localized fallback when a transKey is missing', () => {
    const { messageService } = configureInterceptorTest('browser');

    runInterceptor(createHttpError({ message: 'errors.missingBackendKey', transKey: true }));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Something went wrong. Please try again.',
      }),
    );
  });

  it('uses a localized fallback when no safe backend message exists', () => {
    const { messageService } = configureInterceptorTest('browser');

    runInterceptor(createHttpError({ fieldErrors: { email: 'validation.email' } }));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Something went wrong. Please try again.',
      }),
    );
  });

  it('does not emit toast messages on the server platform', () => {
    const { messageService } = configureInterceptorTest('server');
    const error = createHttpError({ message: 'Backend validation failed.' });

    const propagated = runInterceptor(error);

    expect(messageService.add).not.toHaveBeenCalled();
    expect(propagated).toBe(error);
  });

  function configureInterceptorTest(platformId: 'browser' | 'server') {
    const messageService = { add: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: MessageService, useValue: messageService },
        {
          provide: TranslateService,
          useValue: {
            instant: vi.fn((key: string) => translations[key] ?? key),
          },
        },
      ],
    });

    return { messageService };
  }

  function runInterceptor(error: HttpErrorResponse): unknown {
    let propagated: unknown;

    TestBed.runInInjectionContext(() => {
      globalErrorInterceptor(new HttpRequest('GET', '/api/test'), () => throwError(() => error)).subscribe({
        error: (caught) => {
          propagated = caught;
        },
      });
    });

    return propagated;
  }

  function createHttpError(error: unknown): HttpErrorResponse {
    return new HttpErrorResponse({
      error,
      status: 400,
      statusText: 'Bad Request',
      url: '/api/test',
    });
  }
});

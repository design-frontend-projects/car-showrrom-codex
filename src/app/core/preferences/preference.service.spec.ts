import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  directionForLanguage,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  normalizeThemeMode,
  PreferenceService,
  resolveEffectiveTheme,
  THEME_STORAGE_KEY
} from './preference.service';

describe('PreferenceService helpers', () => {
  it('normalizes theme modes with a system fallback', () => {
    expect(normalizeThemeMode('light')).toBe('light');
    expect(normalizeThemeMode('dark')).toBe('dark');
    expect(normalizeThemeMode('system')).toBe('system');
    expect(normalizeThemeMode('unknown')).toBe('system');
  });

  it('normalizes languages with an English fallback', () => {
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('ar')).toBe('ar');
    expect(normalizeLanguage('fr')).toBe('en');
  });

  it('maps language direction and effective system theme', () => {
    expect(directionForLanguage('en')).toBe('ltr');
    expect(directionForLanguage('ar')).toBe('rtl');
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('system', false)).toBe('light');
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
  });
});

describe('PreferenceService document integration', () => {
  const translateUse = vi.fn();
  const translateSetTranslation = vi.fn();
  const httpGet = vi.fn(() => of({}));
  let mediaListener: ((event: MediaQueryListEvent) => void) | undefined;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      })
    });
    translateUse.mockReset();
    translateSetTranslation.mockReset();
    httpGet.mockClear();
    mediaListener = undefined;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaListener = listener;
      },
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
    vi.unstubAllGlobals();
  });

  function createService(): PreferenceService {
    TestBed.configureTestingModule({
      providers: [
        PreferenceService,
        { provide: DOCUMENT, useValue: document },
        { provide: HttpClient, useValue: { get: httpGet } },
        {
          provide: TranslateService,
          useValue: {
            setTranslation: translateSetTranslation,
            use: translateUse
          }
        }
      ]
    });
    const service = TestBed.inject(PreferenceService);
    service.initialize();
    TestBed.flushEffects();
    return service;
  }

  it('applies selected dark theme and persists it', () => {
    const service = createService();

    service.setThemeMode('dark');
    TestBed.flushEffects();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    expect(document.documentElement.dataset['themeMode']).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('applies Arabic language metadata and persists it', () => {
    const service = createService();

    service.setLanguage('ar');
    TestBed.flushEffects();

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(translateUse).toHaveBeenLastCalledWith('ar');
  });

  it('updates effective theme when system preference changes', () => {
    const service = createService();

    service.setThemeMode('system');
    mediaListener?.({ matches: true } as MediaQueryListEvent);
    TestBed.flushEffects();

    expect(service.themeMode()).toBe('system');
    expect(service.effectiveTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
  });

  it('falls back without crashing when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('storage blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('storage blocked');
      })
    });

    const service = createService();

    expect(service.themeMode()).toBe('system');
    expect(service.language()).toBe('en');
    expect(() => service.setLanguage('ar')).not.toThrow();
    expect(() => service.setThemeMode('dark')).not.toThrow();
  });
});

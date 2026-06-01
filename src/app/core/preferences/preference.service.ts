import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';
export type LanguageCode = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];
export const LANGUAGE_CODES: readonly LanguageCode[] = ['en', 'ar'];
export const DEFAULT_THEME_MODE: ThemeMode = 'system';
export const DEFAULT_LANGUAGE: LanguageCode = normalizeLanguage(environment.i18n.defaultLang);
export const THEME_STORAGE_KEY = 'showroom.themeMode';
export const LANGUAGE_STORAGE_KEY = 'showroom.language';

export function normalizeThemeMode(value: unknown): ThemeMode {
  return typeof value === 'string' && THEME_MODES.includes(value as ThemeMode) ? (value as ThemeMode) : DEFAULT_THEME_MODE;
}

export function normalizeLanguage(value: unknown): LanguageCode {
  return typeof value === 'string' && LANGUAGE_CODES.includes(value as LanguageCode) ? (value as LanguageCode) : 'en';
}

export function directionForLanguage(language: LanguageCode): Direction {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function resolveEffectiveTheme(themeMode: ThemeMode, systemPrefersDark: boolean): EffectiveTheme {
  return themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;
}

@Injectable({ providedIn: 'root' })
export class PreferenceService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly systemPrefersDark = signal(false);
  private readonly themeModeState = signal<ThemeMode>(DEFAULT_THEME_MODE);
  private readonly languageState = signal<LanguageCode>(DEFAULT_LANGUAGE);
  private mediaQueryList: MediaQueryList | null = null;

  readonly themeMode = this.themeModeState.asReadonly();
  readonly language = this.languageState.asReadonly();
  readonly direction = computed(() => directionForLanguage(this.languageState()));
  readonly effectiveTheme = computed(() => resolveEffectiveTheme(this.themeModeState(), this.systemPrefersDark()));

  constructor() {
    effect(() => {
      this.applyLanguage(this.languageState(), this.direction());
    });

    effect(() => {
      this.applyTheme(this.themeModeState(), this.effectiveTheme());
    });
  }

  initialize(): void {
    if (this.isBrowser) {
      this.themeModeState.set(normalizeThemeMode(this.readPersisted(THEME_STORAGE_KEY)));
      this.languageState.set(normalizeLanguage(this.readPersisted(LANGUAGE_STORAGE_KEY)));
      this.observeSystemTheme();
      return;
    }

    this.themeModeState.set(DEFAULT_THEME_MODE);
    this.languageState.set(DEFAULT_LANGUAGE);
  }

  setThemeMode(themeMode: ThemeMode): void {
    this.themeModeState.set(themeMode);
    this.persist(THEME_STORAGE_KEY, themeMode);
  }

  setLanguage(language: LanguageCode): void {
    this.languageState.set(language);
    this.persist(LANGUAGE_STORAGE_KEY, language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageState() === 'en' ? 'ar' : 'en');
  }

  private observeSystemTheme(): void {
    if (!this.isBrowser || !window.matchMedia) {
      return;
    }

    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = (event: MediaQueryList | MediaQueryListEvent): void => {
      this.systemPrefersDark.set(event.matches);
    };

    updateSystemPreference(this.mediaQueryList);
    this.mediaQueryList.addEventListener('change', updateSystemPreference);
    this.destroyRef.onDestroy(() => this.mediaQueryList?.removeEventListener('change', updateSystemPreference));
  }

  private applyTheme(themeMode: ThemeMode, effectiveTheme: EffectiveTheme): void {
    const root = this.document.documentElement;
    root.classList.toggle('app-dark', effectiveTheme === 'dark');
    root.setAttribute('data-theme-mode', themeMode);
    root.setAttribute('data-theme', effectiveTheme);
  }

  private applyLanguage(language: LanguageCode, direction: Direction): void {
    const root = this.document.documentElement;
    root.lang = language;
    root.dir = direction;
    this.translate.use(language);
  }

  private persist(key: string, value: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private browsing or locked-down contexts.
    }
  }

  private readPersisted(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

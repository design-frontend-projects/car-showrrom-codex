import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateLoader, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import {
  Activity,
  Check,
  KeyRound,
  LockKeyhole,
  LucideAngularModule,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-angular';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthSignalStore } from './core/auth/auth.store';
import { globalErrorInterceptor } from './core/interceptors/global-error.interceptor';
import { httpLoggingInterceptor } from './core/interceptors/http-logging.interceptor';
import { RouterLoggingService } from './core/logging/router-logging.service';
import { PreferenceService } from './core/preferences/preference.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, globalErrorInterceptor, httpLoggingInterceptor])),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    }),
    importProvidersFrom(
      LucideAngularModule.pick({
        Activity,
        Check,
        KeyRound,
        LockKeyhole,
        Pencil,
        RefreshCw,
        RotateCcw,
        Save,
        ShieldCheck,
        Trash2,
        UserPlus,
        Users,
        X,
      }),
    ),
    provideTranslateService({
      fallbackLang: environment.i18n.fallbackLang,
      lang: environment.i18n.defaultLang,
      loader: { provide: TranslateLoader, useClass: TranslateHttpLoader }
    }),
    ...provideTranslateHttpLoader({
      prefix: '/i18n/',
      suffix: '.json'
    }),
    MessageService,
    provideAppInitializer(() => {
      const preferences = inject(PreferenceService);
      const translate = inject(TranslateService);

      preferences.initialize();
      inject(RouterLoggingService).start();
      void inject(AuthSignalStore).loadSession();
      return firstValueFrom(translate.use(preferences.language()));
    })
  ]
};

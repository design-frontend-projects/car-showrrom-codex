import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpLoggingInterceptor } from './core/interceptors/http-logging.interceptor';
import { RouterLoggingService } from './core/logging/router-logging.service';
import { AuthEffects } from './core/auth/auth.effects';
import { authReducer } from './core/auth/auth.reducer';
import { appReducer } from './state/app.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpLoggingInterceptor])),
    provideStore({ app: appReducer, auth: authReducer }),
    provideEffects([AuthEffects]),
    provideRouterStore(),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    }),
    provideTranslateService({
      fallbackLang: environment.i18n.fallbackLang,
      lang: environment.i18n.defaultLang,
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      })
    }),
    MessageService,
    provideAppInitializer(() => {
      inject(RouterLoggingService).start();
    })
  ]
};

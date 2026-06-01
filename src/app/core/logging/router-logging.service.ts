import { Injectable, inject } from '@angular/core';
import { NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class RouterLoggingService {
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private started = false;

  start(): void {
    if (this.started || !environment.logging.router) {
      return;
    }

    this.started = true;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationError))
      .subscribe((event) => {
        this.logger.info('router', event.constructor.name, event);
      });
  }
}

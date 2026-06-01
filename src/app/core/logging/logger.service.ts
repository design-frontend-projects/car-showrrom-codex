import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(scope: string, message: string, data?: unknown): void {
    if (!environment.production) {
      console.info(`[${scope}] ${message}`, data ?? '');
    }
  }

  warn(scope: string, message: string, data?: unknown): void {
    console.warn(`[${scope}] ${message}`, data ?? '');
  }
}

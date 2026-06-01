import { Injectable, inject } from '@angular/core';
import { LoginRequest, RegisterRequest } from './auth.models';
import { AuthSignalStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(AuthSignalStore);

  readonly status = this.store.status;
  readonly user = this.store.user;
  readonly error = this.store.error;
  readonly isAuthenticated = this.store.isAuthenticated;

  login(request: LoginRequest): void {
    void this.store.login(request);
  }

  register(request: RegisterRequest): void {
    void this.store.register(request);
  }

  signOut(): void {
    this.store.signOut();
  }
}

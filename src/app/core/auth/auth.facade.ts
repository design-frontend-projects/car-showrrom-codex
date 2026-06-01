import { computed, Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { LoginRequest, RegisterRequest } from './auth.models';
import { selectAuthError, selectAuthStatus, selectAuthUser } from './auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(Store);

  readonly status = this.store.selectSignal(selectAuthStatus);
  readonly user = this.store.selectSignal(selectAuthUser);
  readonly error = this.store.selectSignal(selectAuthError);
  readonly isAuthenticated = computed(() => this.status() === 'authenticated');

  login(request: LoginRequest): void {
    this.store.dispatch(AuthActions.loginRequested({ request }));
  }

  register(request: RegisterRequest): void {
    this.store.dispatch(AuthActions.registerRequested({ request }));
  }

  signOut(): void {
    this.store.dispatch(AuthActions.signedOut());
  }
}

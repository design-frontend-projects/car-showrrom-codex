import { Injectable, inject } from '@angular/core';
import {
  LoginRequest,
  RegisterRequest,
  ResetCompleteRequest,
  ResetRequest,
  ResetVerifyRequest,
  TwoFactorDisableRequest,
  TwoFactorEnableRequest,
  TwoFactorVerifyRequest,
} from './auth.models';
import { AuthSignalStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(AuthSignalStore);

  readonly status = this.store.status;
  readonly user = this.store.user;
  readonly session = this.store.session;
  readonly challenge = this.store.challenge;
  readonly error = this.store.error;
  readonly fieldErrors = this.store.fieldErrors;
  readonly isAuthenticated = this.store.isAuthenticated;
  readonly requiresTwoFactor = this.store.requiresTwoFactor;
  readonly normalizedRoles = this.store.normalizedRoles;
  readonly isAdmin = this.store.isAdmin;
  readonly isSystemOwner = this.store.isSystemOwner;
  readonly canAccessAdmin = this.store.canAccessAdmin;

  loadSession(): Promise<void> {
    return this.store.loadSession();
  }

  ensureCsrf(): Promise<string | null> {
    return this.store.ensureCsrf();
  }

  login(request: LoginRequest): Promise<void> {
    return this.store.login(request);
  }

  register(request: RegisterRequest): Promise<void> {
    return this.store.register(request);
  }

  refreshRoles(): Promise<void> {
    return this.store.refreshRoles();
  }

  verifyTwoFactor(request: TwoFactorVerifyRequest) {
    return this.store.verifyTwoFactor(request);
  }

  startTwoFactorSetup(request?: TwoFactorEnableRequest) {
    return this.store.startTwoFactorSetup(request);
  }

  disableTwoFactor(request: TwoFactorDisableRequest) {
    return this.store.disableTwoFactor(request);
  }

  regenerateBackupCodes(request: TwoFactorDisableRequest) {
    return this.store.regenerateBackupCodes(request);
  }

  resetRequest(request: ResetRequest) {
    return this.store.resetRequest(request);
  }

  resetVerify(request: ResetVerifyRequest) {
    return this.store.resetVerify(request);
  }

  resetComplete(request: ResetCompleteRequest) {
    return this.store.resetComplete(request);
  }

  logoutLocal(): void {
    void this.store.logoutLocal();
  }

  logoutGlobal(): void {
    void this.store.logoutGlobal();
  }

  signOut(): void {
    this.store.signOut();
  }
}

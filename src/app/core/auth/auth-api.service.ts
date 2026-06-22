import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  AuthResponse,
  AuthSession,
  BackupCodesResponse,
  CurrentProfile,
  InvitationOnboardingAcceptRequest,
  InvitationOnboardingLookupRequest,
  LoginRequest,
  OnboardingChallenge,
  RegisterRequest,
  ResetCompleteRequest,
  ResetRequest,
  ResetVerifyRequest,
  ResetVerifyResponse,
  TwoFactorDisableRequest,
  TwoFactorEnableRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly api: ApiService) {}

  csrf(): Observable<{ csrfToken: string }> {
    return this.api.get<{ csrfToken: string }>('/auth/csrf');
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', request);
  }

  register(request: RegisterRequest): Observable<AuthSession> {
    return this.api.post<AuthSession>('/auth/register', request);
  }

  session(): Observable<AuthResponse> {
    return this.api.get<AuthResponse>('/auth/session');
  }

  profile(): Observable<CurrentProfile> {
    return this.api.get<CurrentProfile>('/auth/profile');
  }

  refresh(): Observable<AuthSession> {
    return this.api.post<AuthSession>('/auth/refresh', {});
  }

  logout(): Observable<{ ok: true }> {
    return this.api.post<{ ok: true }>('/auth/logout', {});
  }

  logoutAll(): Observable<{ ok: true }> {
    return this.api.post<{ ok: true }>('/auth/logout-all', {});
  }

  resetRequest(request: ResetRequest): Observable<{ ok: true; demoOtp?: string }> {
    return this.api.post<{ ok: true; demoOtp?: string }>('/auth/reset-request', request);
  }

  resetVerify(request: ResetVerifyRequest): Observable<ResetVerifyResponse> {
    return this.api.post<ResetVerifyResponse>('/auth/reset-verify', request);
  }

  resetComplete(request: ResetCompleteRequest): Observable<{ ok: true }> {
    return this.api.post<{ ok: true }>('/auth/reset-complete', request);
  }

  lookupInvitationOnboarding(request: InvitationOnboardingLookupRequest): Observable<OnboardingChallenge> {
    return this.api.post<OnboardingChallenge>('/auth/invitations/lookup', request);
  }

  acceptInvitationOnboarding(request: InvitationOnboardingAcceptRequest): Observable<{ ok: true }> {
    return this.api.post<{ ok: true }>('/auth/invitations/accept', request);
  }

  enableTwoFactor(request: TwoFactorEnableRequest = {}): Observable<TwoFactorSetupResponse> {
    return this.api.post<TwoFactorSetupResponse>('/auth/2fa-enable', request);
  }

  verifyTwoFactor(request: TwoFactorVerifyRequest): Observable<AuthSession | BackupCodesResponse> {
    return this.api.post<AuthSession | BackupCodesResponse>('/auth/2fa-verify', request);
  }

  disableTwoFactor(request: TwoFactorDisableRequest): Observable<{ ok: true }> {
    return this.api.post<{ ok: true }>('/auth/2fa-disable', request);
  }

  regenerateBackupCodes(request: TwoFactorDisableRequest): Observable<BackupCodesResponse> {
    return this.api.post<BackupCodesResponse>('/auth/2fa-backup-codes/regenerate', request);
  }
}

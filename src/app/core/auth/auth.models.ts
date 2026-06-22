export type AuthStatus = 'anonymous' | 'pending' | 'authenticated' | 'twoFactorRequired' | 'onboardingRequired' | 'failed';

export interface AuthUser {
  id: string;
  tenantId: string;
  tenantSlug: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: readonly string[];
  permissions: readonly string[];
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
}

export interface AuthSession {
  status: 'authenticated';
  user: AuthUser;
  expiresAt: string;
  csrfToken?: string;
}

export interface PersistedAuthState {
  status: 'authenticated';
  session: AuthSession;
  roles: readonly string[];
  persistedAt: string;
}

export interface CurrentProfile {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  roles: readonly string[];
  permissions: readonly string[];
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnonymousSession {
  status: 'anonymous';
}

export interface TwoFactorChallenge {
  status: 'twoFactorRequired';
  challengeToken: string;
  setupRequired: boolean;
  user: {
    email: string;
    displayName: string;
    twoFactorRequired: boolean;
  };
}

export interface OnboardingChallenge {
  status: 'onboardingRequired';
  challengeToken: string;
  invitation: {
    email: string;
    displayName: string | null;
    expiresAt: string;
  };
}

export type AuthResponse = AuthSession | AnonymousSession | TwoFactorChallenge | OnboardingChallenge;

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  phone?: string;
  password: string;
  remember?: boolean;
}

export interface ResetRequest {
  email: string;
}

export interface ResetVerifyRequest {
  email: string;
  otp: string;
}

export interface ResetVerifyResponse {
  resetToken: string;
  expiresAt: string;
}

export interface ResetCompleteRequest {
  resetToken: string;
  password: string;
}

export interface InvitationOnboardingLookupRequest {
  token?: string;
  challengeToken?: string;
}

export interface InvitationOnboardingAcceptRequest {
  token?: string;
  challengeToken?: string;
  displayName: string;
  phone?: string | null;
  password: string;
}

export interface TwoFactorEnableRequest {
  challengeToken?: string;
}

export interface TwoFactorSetupResponse {
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface TwoFactorVerifyRequest {
  challengeToken?: string;
  code?: string;
  backupCode?: string;
}

export interface TwoFactorDisableRequest {
  password: string;
  code?: string;
  backupCode?: string;
}

export interface BackupCodesResponse {
  backupCodes: string[];
}

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  challenge: TwoFactorChallenge | null;
  onboarding: OnboardingChallenge | null;
  error: string | null;
  fieldErrors: Record<string, string>;
  csrfToken: string | null;
  hydratedFromStorage: boolean;
  lastRoleRefreshAt: string | null;
}

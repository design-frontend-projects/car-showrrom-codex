export type AuthStatus = 'anonymous' | 'pending' | 'authenticated' | 'failed';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  roles: readonly string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  expiresAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
}

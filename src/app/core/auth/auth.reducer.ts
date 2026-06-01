import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState } from './auth.models';

export const initialAuthState: AuthState = {
  status: 'anonymous',
  session: null,
  error: null
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.loginRequested, AuthActions.registerRequested, (state) => ({
    ...state,
    status: 'pending' as const,
    error: null
  })),
  on(AuthActions.authenticated, (_state, { session }) => ({
    status: 'authenticated' as const,
    session,
    error: null
  })),
  on(AuthActions.authFailed, (state, { error }) => ({
    ...state,
    status: 'failed' as const,
    error
  })),
  on(AuthActions.signedOut, () => initialAuthState)
);

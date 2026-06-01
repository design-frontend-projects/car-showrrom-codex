import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthSession, LoginRequest, RegisterRequest } from './auth.models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Requested': props<{ request: LoginRequest }>(),
    'Register Requested': props<{ request: RegisterRequest }>(),
    'Authenticated': props<{ session: AuthSession }>(),
    'Auth Failed': props<{ error: string }>(),
    'Signed Out': emptyProps()
  }
});

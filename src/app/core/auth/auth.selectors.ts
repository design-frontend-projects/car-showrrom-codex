import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.models';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectAuthStatus = createSelector(selectAuthState, (state) => state.status);
export const selectAuthSession = createSelector(selectAuthState, (state) => state.session);
export const selectAuthUser = createSelector(selectAuthSession, (session) => session?.user ?? null);
export const selectIsAuthenticated = createSelector(selectAuthStatus, (status) => status === 'authenticated');
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

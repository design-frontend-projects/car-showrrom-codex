import { createReducer, on } from '@ngrx/store';
import { AppActions } from './app.actions';

export interface AppState {
  sidebarOpen: boolean;
}

export const initialAppState: AppState = {
  sidebarOpen: false
};

export const appReducer = createReducer(
  initialAppState,
  on(AppActions.sidebarOpened, (state) => ({ ...state, sidebarOpen: true })),
  on(AppActions.sidebarClosed, (state) => ({ ...state, sidebarOpen: false }))
);

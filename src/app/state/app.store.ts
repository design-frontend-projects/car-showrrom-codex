import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface AppState {
  sidebarOpen: boolean;
}

const initialAppState: AppState = {
  sidebarOpen: false
};

export const AppSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppState),
  withMethods((store) => ({
    openSidebar(): void {
      patchState(store, { sidebarOpen: true });
    },
    closeSidebar(): void {
      patchState(store, { sidebarOpen: false });
    }
  }))
);

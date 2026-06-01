import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface UiSignalState {
  searchTerm: string;
  selectedMarket: 'used' | 'new' | 'rent';
}

const initialState: UiSignalState = {
  searchTerm: '',
  selectedMarket: 'used'
};

export const UiSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    updateSearchTerm(searchTerm: string): void {
      patchState(store, { searchTerm });
    },
    selectMarket(selectedMarket: UiSignalState['selectedMarket']): void {
      patchState(store, { selectedMarket });
    }
  }))
);

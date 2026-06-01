import { createActionGroup, emptyProps } from '@ngrx/store';

export const AppActions = createActionGroup({
  source: 'App',
  events: {
    'Sidebar Opened': emptyProps(),
    'Sidebar Closed': emptyProps()
  }
});

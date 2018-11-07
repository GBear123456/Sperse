import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getStatusesState = createFeatureSelector<State>('statuses');

export const getStatuses = createSelector(
    getStatusesState,
    (state: State) => state.statuses
);

export const getLoadedTime = createSelector(
    getStatusesState,
    (state: State) => state.loadedTime
);

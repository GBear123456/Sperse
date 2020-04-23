import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getEmailUsageTypesState = createFeatureSelector<State>('emailUsageTypes');

export const getEmailUsageTypes = createSelector(
    getEmailUsageTypesState,
    (state: State) => state.emailUsageTypes
);

export const getLoadedTime = createSelector(
    getEmailUsageTypesState,
    (state: State) => state.loadedTime
);

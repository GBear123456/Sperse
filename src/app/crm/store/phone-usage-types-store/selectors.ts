import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getPhoneUsageTypesState = createFeatureSelector<State>('phoneUsageTypes');

export const getPhoneUsageTypes = createSelector(
    getPhoneUsageTypesState,
    (state: State) => state.phoneUsageTypes
);

export const getLoaded = createSelector(
    getPhoneUsageTypesState,
    (state: State) => state.loaded
);

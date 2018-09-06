import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getAddressUsageTypesState = createFeatureSelector<State>('addressUsageTypes');

export const getAddressUsageTypes = createSelector(
    getAddressUsageTypesState,
    (state: State) => state.addressUsageTypes
);

export const getLoaded = createSelector(
    getAddressUsageTypesState,
    (state: State) => state.loaded
);

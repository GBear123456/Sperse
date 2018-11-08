import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getAddressUsageTypesState = createFeatureSelector<State>('addressUsageTypes');

export const getAddressUsageTypes = createSelector(
    getAddressUsageTypesState,
    (state: State) => state.addressUsageTypes
);

export const getLoadedTime = createSelector(
    getAddressUsageTypesState,
    (state: State) => state.loadedTime
);

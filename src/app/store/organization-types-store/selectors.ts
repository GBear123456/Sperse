import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getOrganizationTypesState = createFeatureSelector<State>('organizationTypes');

export const getOrganizationTypes = createSelector(
    getOrganizationTypesState,
    (state: State) => state.organizationTypes
);

export const getLoadedTime = createSelector(
    getOrganizationTypesState,
    (state: State) => state.loadedTime
);

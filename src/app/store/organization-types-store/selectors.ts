import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getOrganizationTypesState = createFeatureSelector<State>('organizationTypes');

export const getOrganizationTypes = createSelector(
    getOrganizationTypesState,
    (state: State) => state.organizationTypes
);

export const getLoaded = createSelector(
    getOrganizationTypesState,
    (state: State) => state.loaded
);

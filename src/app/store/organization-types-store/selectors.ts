import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getOrganizationTypesState = createFeatureSelector<State>('OrganizationTypes');

export const getOrganizationTypes = createSelector(
    getOrganizationTypesState,
    (state: State) => state.statuses
);

export const getLoaded = createSelector(
    getOrganizationTypesState,
    (state: State) => state.loaded
);

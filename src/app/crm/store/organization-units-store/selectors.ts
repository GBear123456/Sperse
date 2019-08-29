import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getOrganizationUnitsState = createFeatureSelector<State>('organizationUnits');

export const getOrganizationUnits = createSelector(
    getOrganizationUnitsState,
    (state: State) => state.items
);

export const getLoadedTime = createSelector(
    getOrganizationUnitsState,
    (state: State) => state.loadedTime
);

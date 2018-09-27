import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getLeadAssignedUsersState = createFeatureSelector<State>('leadAssignedUsers');

export const getAssignedUsers = createSelector(
    getLeadAssignedUsersState,
    (state: State) => state.assignedUsers
);

export const getLoaded = createSelector(
    getLeadAssignedUsersState,
    (state: State) => state.loaded
);

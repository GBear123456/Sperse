import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getAssignedUsersState = createFeatureSelector<State>('assignedUsers');

export const getAssignedUsers = createSelector(
    getAssignedUsersState,
    (state: State) => state.assignedUsers
);

export const getLoaded = createSelector(
    getAssignedUsersState,
    (state: State) => state.loaded
);

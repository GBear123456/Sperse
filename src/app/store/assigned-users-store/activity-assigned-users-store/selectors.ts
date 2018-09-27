import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getActivityAssignedUsersState = createFeatureSelector<State>('activityAssignedUsers');

export const getAssignedUsers = createSelector(
    getActivityAssignedUsersState,
    (state: State) => state.assignedUsers
);

export const getLoaded = createSelector(
    getActivityAssignedUsersState,
    (state: State) => state.loaded
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getCustomerAssignedUsersState = createFeatureSelector<State>('customerAssignedUsers');

export const getAssignedUsers = createSelector(
    getCustomerAssignedUsersState,
    (state: State) => state.assignedUsers
);

export const getLoaded = createSelector(
    getCustomerAssignedUsersState,
    (state: State) => state.loaded
);

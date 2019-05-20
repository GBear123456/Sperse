import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getContactAssignedUsersState = createFeatureSelector<State>('ContactAssignedUsers');

export const getAssignedUsers = createSelector(
    getContactAssignedUsersState,
    (state: State) => state.entities
);

export const getContactGroupAssignedUsers = createSelector(
    getAssignedUsers,
    (states, props) => states[props.contactGroup]
);
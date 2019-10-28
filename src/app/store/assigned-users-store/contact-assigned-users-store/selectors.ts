import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getContactAssignedUsersState = createFeatureSelector<State>('ContactAssignedUsers');

export const getAssignedUsers = createSelector(
    getContactAssignedUsersState,
    (state: State) => state.entities
);

export const getContactGroupAssignedUsers = createSelector(
    getAssignedUsers,
    (groups, props) => groups[props.contactGroup]
);

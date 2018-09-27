import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getPartnerAssignedUsersState = createFeatureSelector<State>('partnerAssignedUsers');

export const getAssignedUsers = createSelector(
    getPartnerAssignedUsersState,
    (state: State) => state.assignedUsers
);

export const getLoaded = createSelector(
    getPartnerAssignedUsersState,
    (state: State) => state.loaded
);

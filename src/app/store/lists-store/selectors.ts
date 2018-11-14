import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State } from './state';
export const getListsState = createFeatureSelector<State>('lists');

export const getLists = createSelector(
    getListsState,
    (state: State) => state.lists
);

export const getLoadedTime = createSelector(
    getListsState,
    (state: State) => state.loadedTime
);

import { createFeatureSelector, createSelector } from '@ngrx/store';

import { State } from './state';
export const getListsState = createFeatureSelector<State>('lists');

export const getLists = createSelector(
    getListsState,
    (state: State) => state.lists
);

export const getListsWithParent = createSelector(
    getLists,
    lists => {
        if (lists) {
            lists.map((obj) => {
                obj['parent'] = 0;
                return obj;
            });
            return lists;
        }
    }
);

export const getLoaded = createSelector(
    getListsState,
    (state: State) => state.loaded
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as _ from 'underscore';

import { State } from './state';
export const getListsState = createFeatureSelector<State>('lists');

export const getLists = createSelector(
    getListsState,
    (state: State) => state.lists
);

export const getStoredLists = createSelector(
    getListsState,
    (state: State) => _.map(
        _.filter(state.lists, function(list){ return Number.isInteger(list.id); })
    )
);

export const getLoadedTime = createSelector(
    getListsState,
    (state: State) => state.loadedTime
);

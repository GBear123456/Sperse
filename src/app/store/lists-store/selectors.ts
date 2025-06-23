import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as _ from 'underscore';

import { State } from './state';
import { ContactListInfoDto } from '@shared/service-proxies/service-proxies';
export const getListsState = createFeatureSelector<State>('lists');

export const getLists = createSelector(
    getListsState,
    (state: State) => state.lists
);

export const getStoredLists = createSelector(
    getListsState,
    (state: State) => _.map(
        _.filter(state.lists, (list: ContactListInfoDto) => Number.isInteger(list.id))
    )
);

export const getLoadedTime = createSelector(
    getListsState,
    (state: State) => state.loadedTime
);

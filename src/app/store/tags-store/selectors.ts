import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as _ from 'underscore';

import { State } from './state';

export const getTagsState = createFeatureSelector<State>('tags');

export const getTags = createSelector(
    getTagsState,
    (state: State) => state.tags
);

export const getStoredTags = createSelector(
    getTagsState,
    (state: State) => _.map(
        _.filter(state.tags, function(tag){ return Number.isInteger(tag.id); })
    )
);

export const getLoadedTime = createSelector(
    getTagsState,
    (state: State) => state.loadedTime
);

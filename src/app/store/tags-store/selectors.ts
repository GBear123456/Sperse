import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getTagsState = createFeatureSelector<State>('tags');

export const getTags = createSelector(
    getTagsState,
    (state: State) => state.tags
);

export const getLoadedTime = createSelector(
    getTagsState,
    (state: State) => state.loadedTime
);

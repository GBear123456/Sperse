import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getTagsState = createFeatureSelector<State>('tags');

export const getTags = createSelector(
    getTagsState,
    (state: State) => state.tags
);

export const getLoaded = createSelector(
    getTagsState,
    (state: State) => state.loaded
);

// export const getAllTags: (
//     state: object
// ) => ContactGroupTagInfoDto[] = tagsAdapter.getSelectors(selectTagsState).selectAll;

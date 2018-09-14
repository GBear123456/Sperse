import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import { ContactGroupTagInfoDto } from 'shared/service-proxies/service-proxies';
import { tagsAdapter, State } from './state';

// export const selectTagsState: MemoizedSelector<
//     object,
//     State
// > = createFeatureSelector<State>('tags');

export const getTagsState = createFeatureSelector<State>('tags');

export const getTags = createSelector(
    getTagsState,
    (state: State) => state.tags
);

export const getTagsWithParent = createSelector(
    getTags,
    tags => {
        if (tags) {
            tags.map((obj) => {
                obj['parent'] = 0;
                return obj;
            });
            return tags;
        }
    }
);

export const getLoaded = createSelector(
    getTagsState,
    (state: State) => state.loaded
);

// export const getAllTags: (
//     state: object
// ) => ContactGroupTagInfoDto[] = tagsAdapter.getSelectors(selectTagsState).selectAll;

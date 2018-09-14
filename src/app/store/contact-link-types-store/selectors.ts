import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getContactLinkTypesState = createFeatureSelector<State>('contactLinkTypes');

export const getContactLinkTypes = createSelector(
    getContactLinkTypesState,
    (state: State) => state.contactLinkTypes
);

export const getLoaded = createSelector(
    getContactLinkTypesState,
    (state: State) => state.loaded
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getLanguagesState = createFeatureSelector<State>('languages');

export const getLanguages = createSelector(
    getLanguagesState,
    (state: State) => state.languages
);

export const getLoadedTime = createSelector(
    getLanguagesState,
    (state: State) => state.loadedTime
);

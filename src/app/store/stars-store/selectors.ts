import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getStarsState = createFeatureSelector<State>('stars');

export const getStars = createSelector(
    getStarsState,
    (state: State) => state.stars
);

export const getLoadedTime = createSelector(
    getStarsState,
    (state: State) => state.loadedTime
);

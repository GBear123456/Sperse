import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getCountriesState = createFeatureSelector<State>('countries');

export const getCountries = createSelector(
    getCountriesState,
    (state: State) => state.countries
);

export const getLoadedTime = createSelector(
    getCountriesState,
    (state: State) => state.loadedTime
);

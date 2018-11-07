import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getStatesState = createFeatureSelector<State>('states');

export const getStates = createSelector(
    getStatesState,
    (state: State) => state.entities
);

export const getState = createSelector(
    getStates,
    (states, props) => states[props.countryCode] && states[props.countryCode].items
);

export const getLoadedTime = createSelector(
    getStates,
    (states, props) => states[props.countryCode] && states[props.countryCode].loadedTime
);

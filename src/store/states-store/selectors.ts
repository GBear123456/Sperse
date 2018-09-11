import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getStatesState = createFeatureSelector<State>('states');

export const getStates = createSelector(
    getStatesState,
    (state: State) => state.entities
);

export const getState = createSelector(
    getStates,
    (states, props) => {
        return states[props.countryCode];
    }
);

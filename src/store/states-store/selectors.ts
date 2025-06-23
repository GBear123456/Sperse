import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State, StateEntity } from './state';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';

export const getStatesState = createFeatureSelector<State>('states');

export const getCountriesStates = createSelector(
    getStatesState,
    (state: State) => state.entities
);

export const getCountryStates = createSelector(
    getCountriesStates,
    (entities: { [id: string]: StateEntity }, props) => entities[props.countryCode] && entities[props.countryCode].items
);

export const getStateCodeFromStateName = createSelector(
    getCountryStates,
    (states: CountryStateDto[], props) => {
        const state = states.find((state: CountryStateDto) => state.name === props.stateName);
        return state && state.code;
    }
)

export const getLoadedTime = createSelector(
    getCountriesStates,
    (states, props) => states[props.countryCode] && states[props.countryCode].loadedTime
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getPartnerTypesState = createFeatureSelector<State>('partnerTypes');

export const getPartnerTypes = createSelector(
    getPartnerTypesState,
    (state: State) => {
        return state.partnerTypes && state.partnerTypes.length ?
               state.partnerTypes.map(type => {
                   return {
                       id: type.id,
                       name: type.name,
                       text: type.name
                   };
               }) :
               state.partnerTypes;
    }
);

export const getLoaded = createSelector(
    getPartnerTypesState,
    (state: State) => state.loaded
);

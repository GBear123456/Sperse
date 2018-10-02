import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getPartnerTypesState = createFeatureSelector<State>('partnerTypes');

export const getPartnerTypes = createSelector(
    getPartnerTypesState,
    (state: State) => {
        return state.partnerTypes
    }
);

export const getLoaded = createSelector(
    getPartnerTypesState,
    (state: State) => state.loaded
);

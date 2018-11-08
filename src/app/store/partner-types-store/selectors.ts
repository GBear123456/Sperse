import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getPartnerTypesState = createFeatureSelector<State>('partnerTypes');

export const getPartnerTypes = createSelector(
    getPartnerTypesState,
    (state: State) => state.partnerTypes
);

export const getLoadedTime = createSelector(
    getPartnerTypesState,
    (state: State) => state.loadedTime
);

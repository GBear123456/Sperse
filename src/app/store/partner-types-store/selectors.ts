import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as _ from 'underscore';
import { State } from './state';

export const getPartnerTypesState = createFeatureSelector<State>('partnerTypes');

export const getPartnerTypes = createSelector(
    getPartnerTypesState,
    (state: State) => state.partnerTypes
);

export const getStoredPartnerTypes = createSelector(
    getPartnerTypesState,
    (state: State) => _.map(
        _.filter(state.partnerTypes, function(partnerType){ return Number.isInteger(partnerType.id); })
    )
);

export const getLoadedTime = createSelector(
    getPartnerTypesState,
    (state: State) => state.loadedTime
);

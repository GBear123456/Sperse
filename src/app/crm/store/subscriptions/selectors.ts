import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';

export const getSubscriptionsState = createFeatureSelector<State>('subscriptions');

export const getSubscriptions = createSelector(
    getSubscriptionsState,
    (state: State) => state.items
);

export const getLoadedTime = createSelector(
    getSubscriptionsState,
    (state: State) => state.loadedTime
);
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Currency, State } from './state';

export const getCurrenciesState = createFeatureSelector<State>('currencies');

export const getCurrencies = createSelector(
    getCurrenciesState,
    (state: State) => state.entities
);

export const getCurrenciesTexts = createSelector(
    getCurrencies,
    currencies => currencies.map(currency => ({ text: currency.value }))
);

export const getSelectedCurrencyId = createSelector(
    getCurrenciesState,
    (state: State) => state.selectedCurrencyId
);

export const getSelectedCurrencyIndex = createSelector(
    getCurrencies,
    getSelectedCurrencyId,
    (currencies: Currency[], selectedCurrencyId: string) => {
        const index = currencies.findIndex((currency: Currency) => currency.value === selectedCurrencyId);
        return index > -1 ? index : 0;
    }
);

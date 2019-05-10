import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { CurrencyInfo } from '@shared/service-proxies/service-proxies';

export const getCurrenciesState = createFeatureSelector<State>('currencies');

export const getCurrencies = createSelector(
    getCurrenciesState,
    (state: State) => state.entities
);

export const getCurrenciesTexts = createSelector(
    getCurrencies,
    (currencies: CurrencyInfo[]) => currencies && currencies.map((currency: CurrencyInfo) => ({ ...currency, text: currency.id }))
);

export const getSelectedCurrencyId = createSelector(
    getCurrenciesState,
    (state: State) => state.selectedCurrencyId
);

export const getSelectedCurrencyIndex = createSelector(
    getCurrencies,
    getSelectedCurrencyId,
    (currencies: CurrencyInfo[], selectedCurrencyId: string) => {
        let result = null;
        if (currencies) {
            const index = currencies.findIndex((currency: CurrencyInfo) => currency.id === selectedCurrencyId);
            if (index > -1) {
                result = index;
            }
        }
        return result;
    }
);

export const getLoadedTime = createSelector(
    getCurrenciesState,
    (state: State) => state.loadedTime
);

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { CurrencyInfo } from '@shared/service-proxies/service-proxies';

export const getCurrenciesState = createFeatureSelector<State>('currencies');

export const getCurrencies = createSelector(
    getCurrenciesState,
    (state: State) => {
        return state.entities && state.entities.length
                ? state.entities.map((currency: CurrencyInfo) => {
                    return {
                        ...currency,
                        text: `${currency.symbol} ${currency.id} ${currency.name}`
                    };
                })
                : null;
    }
);

export const getSelectedCurrencyId = createSelector(
    getCurrenciesState,
    (state: State) => state.selectedCurrencyId
);

export const getSelectedCurrencySymbol = createSelector(
    getCurrencies,
    getSelectedCurrencyId,
    (currencies: Partial<CurrencyInfo>[], selectedCurrencyId: string) => {
        let result = null;
        if (currencies) {
            const currency = currencies.find((currency: CurrencyInfo) => currency.id === selectedCurrencyId);
            if (currency) {
                result = currency.symbol;
            }
        }
        return result;
    }
);

export const getSelectedCurrencyIndex = createSelector(
    getCurrencies,
    getSelectedCurrencyId,
    (currencies: Partial<CurrencyInfo>[], selectedCurrencyId: string) => {
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

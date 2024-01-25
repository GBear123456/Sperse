import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { CurrencyDto } from '@shared/service-proxies/service-proxies';

export const getCurrenciesState = createFeatureSelector<State>('currencies-crm');

export const getCurrencies = createSelector(
    getCurrenciesState,
    (state: State) => {
        return state && state.entities && state.entities.length
            ? state.entities.map((currency: CurrencyDto) => {
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
    (state: State) => state && state.selectedCurrencyId
);

export const getSelectedCurrencySymbol = createSelector(
    getCurrencies,
    getSelectedCurrencyId,
    (currencies: Partial<CurrencyDto>[], selectedCurrencyId: string) => {
        let result = null;
        if (currencies) {
            const currency = currencies.find((currency: CurrencyDto) => currency.id === selectedCurrencyId);
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
    (currencies: Partial<CurrencyDto>[], selectedCurrencyId: string) => {
        let result = null;
        if (currencies) {
            const index = currencies.findIndex((currency: CurrencyDto) => currency.id === selectedCurrencyId);
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

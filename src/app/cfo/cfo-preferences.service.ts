import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { CfoStore, CurrenciesStoreSelectors } from '@app/cfo/store';

export class CurrencyItem {
    text: string;
}

@Injectable()
export class CfoPreferencesService {
    currencies: CurrencyItem[];
    selectedCurrencyId: string;
    selectedCurrencyIndex: number;
    constructor(private store$: Store<CfoStore.State>) {
        this.store$
            .pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId))
            .subscribe((selectedCurrencyId: string) => {
                this.selectedCurrencyId = selectedCurrencyId;
            });

        this.store$
            .pipe(select(CurrenciesStoreSelectors.getCurrenciesTexts))
            .subscribe(currenciesTexts => this.currencies = currenciesTexts);

        this.store$
            .pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyIndex))
            .subscribe(selectedCurrencyIndex => this.selectedCurrencyIndex = selectedCurrencyIndex);
    }
}

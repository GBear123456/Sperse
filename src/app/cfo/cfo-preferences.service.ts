/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';

/** Application imports */
import { CfoStore, CurrenciesStoreActions, CurrenciesStoreSelectors } from '@app/cfo/store';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';

export class CurrencyItem {
    text: string;
}

@Injectable()
export class CfoPreferencesService {
    currencies: CurrencyItem[];
    selectedCurrencyId: string;
    selectedCurrencyIndex: number;
    constructor(
        private store$: Store<CfoStore.State>,
        private cashflowPreferencesService: UserPreferencesService
    ) {
        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            first()
        ).subscribe((currencyId: string) => {
            /** If currency id hasn't been chosen by user and hasn't been saved in storage */
            if (currencyId === null) {
                /** Load user preferences */
                this.cashflowPreferencesService.userPreferences$.pipe(
                    map((preferences: CashFlowGridSettingsDto) => {
                        return preferences.localizationAndCurrency.currency;
                    })
                ).subscribe((currencyId: string) => {
                    /** Update selected currency id with the currency id from cashflow preferences */
                    this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(currencyId));
                });
            }
        });

        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            filter(Boolean)
        ).subscribe((selectedCurrencyId: string) => {
            this.selectedCurrencyId = selectedCurrencyId;
        });

        this.store$
            .pipe(select(CurrenciesStoreSelectors.getCurrenciesTexts))
            .subscribe(currenciesTexts => this.currencies = currenciesTexts);

        this.store$
            .pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyIndex))
            .subscribe(selectedCurrencyIndex => this.selectedCurrencyIndex = selectedCurrencyIndex);
    }

    /**
     * Get not null currency id
     * @returns {Observable<string>}
     */
    public getCurrencyId(): Observable<string> {
        return this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            filter(Boolean),
            first()
        );
    }
}

/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { Observable, zip } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';

/** Application imports */
import { CfoStore, CurrenciesStoreActions, CurrenciesStoreSelectors } from '@app/cfo/store';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CashFlowGridSettingsDto, CurrencyInfo } from '@shared/service-proxies/service-proxies';

@Injectable()
export class CfoPreferencesService {
    currencies$: Observable<Partial<CurrencyInfo>[]>;
    selectedCurrencyId: string;
    selectedCurrencySymbol: string;
    selectedCurrencyIndex$: Observable<number>;
    constructor(
        private store$: Store<CfoStore.State>,
        private cashflowPreferencesService: UserPreferencesService
    ) {
        this.store$.dispatch(new CurrenciesStoreActions.LoadRequestAction());
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
                    }),
                    first()
                ).subscribe((currencyId: string) => {
                    /** Update selected currency id with the currency id from cashflow preferences */
                    this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(currencyId || 'USD'));
                });
            }
        });

        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyId),
            filter(Boolean)
        ).subscribe((selectedCurrencyId: string) => {
            this.selectedCurrencyId = selectedCurrencyId;
        });

        this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencySymbol),
            filter(Boolean)
        ).subscribe((selectedCurrencySymbol: string) => {
            this.selectedCurrencySymbol = selectedCurrencySymbol;
        });

        this.selectedCurrencyIndex$ = this.store$.pipe(
            select(CurrenciesStoreSelectors.getSelectedCurrencyIndex),
            filter(selectedCurrencyIndex => selectedCurrencyIndex !== null)
        );
        this.currencies$ = this.store$.pipe(
            select(CurrenciesStoreSelectors.getCurrencies),
            filter(Boolean)
        );
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

    public getCurrenciesAndSelectedIndex(): Observable<[Partial<CurrencyInfo>[], number]> {
        return zip(
            this.currencies$.pipe(first()),
            this.selectedCurrencyIndex$.pipe(first())
        );
    }
}

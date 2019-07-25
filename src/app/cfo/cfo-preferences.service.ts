/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { CfoStore, CurrenciesStoreActions, CurrenciesStoreSelectors } from '@app/cfo/store';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CashFlowGridSettingsDto, CurrencyInfo } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';

@Injectable()
export class CfoPreferencesService {
    currencies$: Observable<Partial<CurrencyInfo>[]>;
    selectedCurrencyId: string;
    selectedCurrencySymbol: string;
    selectedCurrencyIndex$: Observable<number>;
    dateRange: BehaviorSubject<CalendarValuesModel> = new BehaviorSubject<CalendarValuesModel>({
        from: { value: DateHelper.addTimezoneOffset(moment().subtract(1, 'month').startOf('month').toDate(), true) },
        to: { value: DateHelper.addTimezoneOffset(moment().subtract(1, 'month').endOf('month').toDate(), true) },
        period: 'LastMonth'
    });
    dateRange$: Observable<CalendarValuesModel> = this.dateRange.asObservable();
    dateRangeForFilter$: Observable<any> = this.dateRange$.pipe(
        map((dateRange: CalendarValuesModel) => {
            return dateRange && {
                from: { value: dateRange.from.value && this.getShiftedDate(dateRange.from.value) },
                to: { value: dateRange.from.value && this.getShiftedDate(dateRange.to.value) }
            };
        })
    );
    periodLabel$: Observable<string> = this.dateRange$.pipe(
        map((dateRange: CalendarValuesModel) => {
            return dateRange && dateRange.period ? this.ls.l('Periods_' + dateRange.period) : (
                dateRange && dateRange.from && dateRange.to ? this.formatDate(dateRange.from.value) + ' - ' + this.formatDate(dateRange.to.value) : this.ls.l('LastMonth')
            );
        })
    );

    constructor(
        private store$: Store<CfoStore.State>,
        private cashflowPreferencesService: UserPreferencesService,
        private ls: AppLocalizationService
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

    private getShiftedDate(date): Date {
        return DateHelper.removeTimezoneOffset(new Date(date.getTime()));
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
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

/** Core import */
import { Component, ElementRef } from '@angular/core';

/** Third party import */
import { select, Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { filter, finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    DashboardServiceProxy,
    GetSpendingCategoriesOutput,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CurrenciesStoreSelectors } from '@app/cfo/store';
import { CfoStore } from '@app/cfo/store';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { DailyStatsPeriodModel } from '@shared/cfo/dashboard-widgets/accounts/daily-stats-period.model';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'top-spending-categories',
    templateUrl: './top-spending-categories.component.html',
    styleUrls: ['./top-spending-categories.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class TopSpendingCategoriesComponent {
    period$: Observable<DailyStatsPeriodModel> = this.dashboardService.dailyStatsPeriod$;
    topSpendingCategories$: Observable<GetSpendingCategoriesOutput[]> = combineLatest(
        this.bankAccountsService.selectedBankAccountsIds$,
        this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean)),
        this.period$,
        this.dashboardService.refresh$
    ).pipe(
        tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
        switchMap(([selectedBankAccountsIds, currencyId, period]: [ number[], string, DailyStatsPeriodModel]) => {
            return this.dashboardServiceProxy.getSpendingCategories(
                this.cfoService.instanceType as InstanceType,
                this.cfoService.instanceId,
                selectedBankAccountsIds,
                currencyId,
                5,
                period.startDate,
                period.endDate
            ).pipe(
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            );
        })
    );
    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardService: DashboardService,
        private cfoService: CFOService,
        private bankAccountsService: BankAccountsService,
        private cfoPreferences: CfoPreferencesService,
        private store$: Store<CfoStore.State>,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {}

}

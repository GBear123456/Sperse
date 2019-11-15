/** Core import */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostBinding, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party import */
import { select, Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { filter, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';

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
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { DailyStatsPeriodModel } from '@shared/cfo/dashboard-widgets/accounts/daily-stats-period.model';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { CurrencyPipe } from '@angular/common';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'top-spending-categories',
    templateUrl: './top-spending-categories.component.html',
    styleUrls: ['./top-spending-categories.component.less'],
    providers: [ CurrencyPipe, DashboardServiceProxy, LifecycleSubjectsService ]
})
export class TopSpendingCategoriesComponent implements OnInit, OnDestroy {
    @ViewChild(DxPieChartComponent) pieChart: DxPieChartComponent;
    @HostBinding('class.fullpage') @Input() fullpage = false;

    period$: Observable<DailyStatsPeriodModel> = this.dashboardService.dailyStatsPeriod$;
    currencyId: string;
    topSpendingCategories: GetSpendingCategoriesOutput[];
    topSpendingCategories$: Observable<GetSpendingCategoriesOutput[]> = combineLatest(
        this.bankAccountsService.selectedBankAccountsIds$,
        this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean)),
        this.period$,
        this.dashboardService.refresh$
    ).pipe(
        tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
        switchMap(([selectedBankAccountsIds, currencyId, period]: [ number[], string, DailyStatsPeriodModel]) => {
            this.currencyId = currencyId;
            return this.dashboardServiceProxy.getSpendingCategories(
                this.cfoService.instanceType as InstanceType,
                this.cfoService.instanceId,
                5,
                selectedBankAccountsIds,
                currencyId,
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
        private store$: Store<RootStore.State>,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private currencyPipe: CurrencyPipe,
        private router: Router,
        private route: ActivatedRoute,
        private lifeCycleService: LifecycleSubjectsService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.topSpendingCategories$
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((totalSpendingCategories: GetSpendingCategoriesOutput[]) => {
                this.topSpendingCategories = totalSpendingCategories;
            });
    }

    customizeLegendText = (pointInfo) => {
        let text = pointInfo.pointName;
        if (this.topSpendingCategories && this.topSpendingCategories.length) {
            const amount = this.topSpendingCategories[pointInfo.pointIndex].amount;
            text = this.currencyPipe.transform(amount, this.currencyId, 'symbol-narrow', '1.2-2') + ' ' + pointInfo.pointName;
        }
        return text;
    }

    onClick(e) {
        const pointInfo = e.points ? e.points[0] : e.target;
        const category: GetSpendingCategoriesOutput = this.topSpendingCategories[pointInfo.index];
        this.router.navigate(
            ['../transactions'],
            {
                queryParams: { categoryIds: [ category.id ]},
                relativeTo: this.route
            }
        );
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}

/** Core import */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostBinding, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party import */
import { select, Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { filter, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';
import * as moment from 'moment';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    DashboardServiceProxy,
    GetSpendingCategoriesOutput,
    InstanceType
} from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { RootStore, CurrenciesStoreSelectors } from '@root/store';
import { DashboardService } from '@shared/cfo/dashboard-widgets/dashboard.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';

@Component({
    selector: 'top-spending-categories',
    templateUrl: './top-spending-categories.component.html',
    styleUrls: ['./top-spending-categories.component.less'],
    providers: [ CurrencyPipe, DashboardServiceProxy, LifecycleSubjectsService ]
})
export class TopSpendingCategoriesComponent implements OnInit, OnDestroy {
    @ViewChild(DxPieChartComponent, { static: true }) pieChart: DxPieChartComponent;
    @HostBinding('class.fullpage') @Input() fullpage = false;

    period$: Observable<CalendarValuesModel> = this.calendarService.dateRange$;
    currencyId: string;
    topSpendingCategories: GetSpendingCategoriesOutput[];
    topSpendingCategories$: Observable<GetSpendingCategoriesOutput[]> = combineLatest(
        this.bankAccountsService.selectedBankAccountsIds$,
        this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId), filter(Boolean)),
        this.period$,
        this.dashboardService.refresh$
    ).pipe(
        tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
        switchMap(([selectedBankAccountsIds, currencyId, period, ]: [number[], string, CalendarValuesModel, null]) => {
            this.currencyId = currencyId;
            return this.dashboardServiceProxy.getSpendingCategories(
                this.cfoService.instanceType as InstanceType,
                this.cfoService.instanceId,
                5,
                selectedBankAccountsIds && selectedBankAccountsIds.length ? selectedBankAccountsIds.join('_') : undefined,
                currencyId,
                DateHelper.getStartDate(period.from.value),
                DateHelper.getEndDate(period.to.value)
            ).pipe(
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            );
        })
    );
    colorsPalette: string[] = [ '#e47822', '#3d8ba9', '#99c24d', '#fed142', '#a5cfdf' ];

    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardService: DashboardService,
        private cfoService: CFOService,
        private bankAccountsService: BankAccountsService,
        private store$: Store<RootStore.State>,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        private currencyPipe: CurrencyPipe,
        private router: Router,
        private route: ActivatedRoute,
        private lifeCycleService: LifecycleSubjectsService,
        private calendarService: CalendarService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.topSpendingCategories$
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((totalSpendingCategories: GetSpendingCategoriesOutput[]) => {
                this.topSpendingCategories = totalSpendingCategories;
            });
    }

    onClick(e) {
        const pointInfo = e.points ? e.points[0] : e.target;
        const category: GetSpendingCategoriesOutput = this.topSpendingCategories[pointInfo.index];
        this.redirectToTransactions(category.id);
    }

    legendItemClick(categoryId: number) {
        this.redirectToTransactions(categoryId);
    }

    private redirectToTransactions(categoryId: number) {
        this.router.navigate(
            ['../transactions'],
            {
                queryParams: {
                    categoryIds: [ categoryId ]
                },
                relativeTo: this.route
            }
        );
    }

    ngOnDestroy() {
        this.lifeCycleService.destroy.next();
    }
}

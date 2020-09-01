/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy, GetRecentlyCreatedCustomersOutput } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { IRecentClientsSelectItem } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients-select-item.interface';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ DashboardServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentClientsComponent implements OnInit {
    recordsCount = 10;
    formatting = AppConsts.formatting;
    recentlyCreatedCustomers$: Observable<GetRecentlyCreatedCustomersOutput[]>;
    selectItems: IRecentClientsSelectItem[] = [
        {
            name: this.ls.l('CRMDashboard_RecentLeads'),
            message: this.ls.ls('CRM', 'CRMDashboard_LastNLeadsRecords',  [this.recordsCount]),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            dataSource: this.dashboardServiceProxy.getRecentlyCreatedLeads(this.recordsCount, undefined)
        },
        {
            name: this.ls.l('CRMDashboard_RecentClients'),
            message: this.ls.ls('CRM', 'CRMDashboard_LastNClientsRecords', [this.recordsCount]),
            dataLink: 'app/crm/contact',
            allRecordsLink: '/app/crm/clients',
            dataSource: this.dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount, undefined)
        }
    ];

    selectedItem: BehaviorSubject<IRecentClientsSelectItem> = new BehaviorSubject<IRecentClientsSelectItem>(this.selectItems[0]);
    selectedItem$: Observable<IRecentClientsSelectItem> = this.selectedItem.asObservable().pipe(distinctUntilChanged());
    userTimezone = DateHelper.getUserTimezone();

    constructor(
        private dashboardServiceProxy: DashboardServiceProxy,
        private dashboardWidgetsService: DashboardWidgetsService,
        private loadingService: LoadingService,
        private router: Router,
        private elementRef: ElementRef,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor
    ) {}

    ngOnInit() {
        this.recentlyCreatedCustomers$ = combineLatest(
            this.selectedItem$,
            this.dashboardWidgetsService.refresh$
        ).pipe(
            tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
            switchMap(([selectedItem]) => selectedItem.dataSource.pipe(
                catchError(() => of([])),
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            ))
        );
    }

    onCellClick($event) {
        if (this.selectedItem.value && this.selectedItem.value.dataLink) {
            $event.row && this.router.navigate(
                [this.selectedItem.value.dataLink, $event.row.data.id],
                { queryParams: {referrer: this.router.url} }
            );
        }
    }

    onSelectionChanged($event) {
        this.selectedItem.next($event.selectedItem);
    }
}

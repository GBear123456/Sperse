/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, finalize, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy, GetRecentlyCreatedCustomersOutput } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';
import { IRecentClientsSelectItem } from '@shared/crm/dashboard-widgets/recent-clients/recent-clients-select-item.interface';

@Component({
    selector: 'recent-clients',
    templateUrl: './recent-clients.component.html',
    styleUrls: ['./recent-clients.component.less'],
    providers: [ DashboardServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentClientsComponent implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    recordsCount = 10;
    formatting = AppConsts.formatting;
    recentlyCreatedCustomers$: Observable<GetRecentlyCreatedCustomersOutput[]>;
    selectItems: IRecentClientsSelectItem[] = [
        {
            name: this.ls.l('CRMDashboard_RecentLeads'),
            message: this.ls.l('CRMDashboard_LastNLeadsRecords', 'CRM',  [this.recordsCount]),
            dataLink: '',
            allRecordsLink: '/app/crm/leads',
            dataSource: this._dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount, true)
        },
        {
            name: this.ls.l('CRMDashboard_RecentClients'),
            message: this.ls.l('CRMDashboard_LastNClientsRecords', 'CRM',  [this.recordsCount]),
            dataLink: 'app/crm/contact',
            allRecordsLink: '/app/crm/clients',
            dataSource: this._dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount, false)
        }
    ];

    selectedItem: BehaviorSubject<IRecentClientsSelectItem> = new BehaviorSubject<IRecentClientsSelectItem>(this.selectItems[0]);
    selectedItem$: Observable<IRecentClientsSelectItem> = this.selectedItem.asObservable().pipe(distinctUntilChanged());

    constructor(
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _loadingService: LoadingService,
        private _router: Router,
        private _elementRef: ElementRef,
        public ls: AppLocalizationService,
        public httpInterceptor: AppHttpInterceptor
    ) {}

    ngOnInit() {
        this.recentlyCreatedCustomers$ = combineLatest(
            this.selectedItem$,
            this._dashboardWidgetsService.refresh$
        ).pipe(
            tap(() => this._loadingService.startLoading(this._elementRef.nativeElement)),
            switchMap(([selectedItem]) => selectedItem.dataSource.pipe(
                catchError(() => of([])),
                finalize(() => this._loadingService.finishLoading(this._elementRef.nativeElement))
            ))
        );
    }

    onCellClick($event) {
        if (this.selectedItem.value && this.selectedItem.value.dataLink) {
            $event.row && this._router.navigate(
                [this.selectedItem.value.dataLink, $event.row.data.id],
                {queryParams: {referrer: this._router.url}}
            );
        }
    }

    onSelectionChanged($event) {
        this.selectedItem.next($event.selectedItem);
    }
}

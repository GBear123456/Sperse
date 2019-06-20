/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { DashboardServiceProxy, GetRecentlyCreatedCustomersOutput } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { AppConsts } from '@shared/AppConsts';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { Router } from '@angular/router';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';

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
        this.recentlyCreatedCustomers$ = this._dashboardWidgetsService.refresh$.pipe(
            tap(() => this._loadingService.startLoading(this._elementRef.nativeElement)),
            switchMap(() => this._dashboardServiceProxy.getRecentlyCreatedCustomers(this.recordsCount).pipe(
                finalize(() => this._loadingService.finishLoading(this._elementRef.nativeElement))
            ))
        );
    }

    onCellClick($event) {
        $event.row && this._router.navigate(
            ['app/crm/contact', $event.row.data.id],
            {queryParams: {referrer: this._router.url}}
        );
    }
}

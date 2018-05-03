import { Router } from '@angular/router';
import { Component, AfterViewInit, ViewChild, Injector, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppSalesSummaryDatePeriod } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';
import { PeriodComponent } from '@app/shared/common/period/period.component';

import { DashboardWidgetsService } from '@shared/crm/dashboard-widgets/dashboard-widgets.service';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./dashboard.component.less'],
    providers: [DashboardWidgetsService]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    @ViewChild(PeriodComponent) periodComponent: PeriodComponent;
    private rootComponent: any;
    private selectedPeriod: any;
        
    public dataEmpty: boolean;
    public headlineConfig = {
      names: [this.l('Dashboard')],
      onRefresh: this.refresh.bind(this),
      text: this.l('statistics and reports'),
      icon: 'globe',
      buttons: []
    };
    
    constructor(
        injector: Injector,
        private _router: Router,
        private _dashboardService: TenantDashboardServiceProxy,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    refresh() {
        this.periodChanged(this.selectedPeriod);
    }

    checkDataEmpty(data) {      
        this.dataEmpty = !data.length;
        this.finishLoading(true);
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], 
            { queryParams: { action: 'addNew' } });
    }

    periodChanged($event) {
        this._dashboardWidgetsService.periodChanged(
            this.selectedPeriod = $event
        );
    }

    ngAfterViewInit(): void {
        AppComponentBase.zendeskWebwidgetShow(this._ngxZendeskWebwidgetService);
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
        this.startLoading(true);
    }

    ngOnDestroy() {
        AppComponentBase.zendeskWebwidgetHide(this._ngxZendeskWebwidgetService);
        this.rootComponent.overflowHidden();
    }
}
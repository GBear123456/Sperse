import { Router } from '@angular/router';
import { Component, AfterViewInit, Injector, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { AppSalesSummaryDatePeriod } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';

import * as _ from 'lodash';

@Component({
  templateUrl: './dashboard.component.html',
  animations: [appModuleAnimation()],
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    private rootComponent: any;
    public dataEmpty;
    public headlineConfig = {
      names: [this.l('Dashboard')],
      text: this.l('statistics and reports'),
      icon: 'globe',
      buttons: []
    };

    constructor(
        injector: Injector,
        private _router: Router,
        private _dashboardService: TenantDashboardServiceProxy,
        private _ngxZendeskWebwidgetService: ngxZendeskWebwidgetService,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    checkDataEmpty(data) {      
        this.dataEmpty = !data.length;
        this.finishLoading(true);
    }

    addClient() {
        this._router.navigate(['app/crm/clients'], { queryParams: { action: 'addNewClient' } });
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

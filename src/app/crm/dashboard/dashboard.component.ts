import { Component, AfterViewInit, Injector, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
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
    dataEmpty = false;
    public headlineConfig = {
      names: [this.l('Dashboard')],
      text: this.l('statistics and reports'),
      icon: 'globe',
      buttons: []
    };

    constructor(
        injector: Injector,
        private _dashboardService: TenantDashboardServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
    }
}

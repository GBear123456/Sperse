import { Component, AfterViewInit, Injector, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppSalesSummaryDatePeriod } from '@shared/AppEnums';
declare let d3, Datamap: any;
import * as _ from 'lodash';

@Component({
  templateUrl: './dashboard.component.html',
  animations: [appModuleAnimation()],
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit, OnDestroy {


    constructor(
        injector: Injector,
        private _dashboardService: TenantDashboardServiceProxy
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy() {

    }
};


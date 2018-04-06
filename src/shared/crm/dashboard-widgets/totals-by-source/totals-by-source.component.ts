import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service'; 

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: []
})
export class TotalsBySourceComponent extends AppComponentBase implements OnInit {
    totalsData: any = [
        { type: "10 - 20",  yield: 10 },
        { type: "25 - 50",  yield: 15 },
        { type: "50 - 100", yield: 9 }
    ];

    constructor(
        injector: Injector,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        super(injector);

        _dashboardWidgetsService.subscribePeriodChange((period) => {
            _dashboardServiceProxy.getCustomersByCompanySize(
                period && period.form, period && period.to)
                    .subscribe((result) => {
                        //console.log(result);
                    }
            )
        });
    }

    onInitialized($event) { 
        setTimeout(() => {
            $event.component.render();
        }, 1000);
    }

    ngOnInit() {

    }
}
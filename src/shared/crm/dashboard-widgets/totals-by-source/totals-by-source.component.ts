import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service'; 

import * as _ from "underscore";

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: []
})
export class TotalsBySourceComponent extends AppComponentBase implements OnInit {
    totalsData: any;
    totalCount = 0;
    percentage: string;

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
                        this.totalCount = 0;
                        result.forEach((item) => {
                            if (!item.companySizeRange)
                                item.companySizeRange = 'Unknown';
                            this.totalCount += item.customerCount;
                        });
                        this.totalsData = result;
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

    customizePoint = (data) => {
        let color = [
            '#F9B65C',
            '#98D66B',
            '#ED9757'
        ][data.index];

        if (color)
            return {    
                color: color
            }
    }

    onPointHoverChanged($event) {
        this.percentage = $event.target.fullState ? 
            ($event.target.percent * 100).toFixed(2) + '%': '';
    }
}

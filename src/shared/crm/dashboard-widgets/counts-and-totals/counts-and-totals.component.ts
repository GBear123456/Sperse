import { Component, Injector, Output, EventEmitter } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardWidgetsService } from '../dashboard-widgets.service';

@Component({
    selector: 'counts-and-totals',
    templateUrl: './counts-and-totals.component.html',
    styleUrls: ['./counts-and-totals.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class CountsAndTotalsComponent extends AppComponentBase {
    @Output() onDataLoaded = new EventEmitter();

    data = {};

    fields: any;

    constructor(
        injector: Injector,
        private _dashboardService: DashboardWidgetsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this.fields = _dashboardService.totalsDataFields;

        _dashboardService.subscribeTotalsData(result => {
            this.data = result;
            this.onDataLoaded.emit(result['totalOrderAmount'] ||
                result['totalLeadCount'] || result['totalClientCount'] ? [result] : []);
            this.fields.forEach((field) => {
                field.percent = _dashboardService.getPercentage(
                    result[field.name.replace('total', 'new')], result[field.name]);
            });
        });
    }

}

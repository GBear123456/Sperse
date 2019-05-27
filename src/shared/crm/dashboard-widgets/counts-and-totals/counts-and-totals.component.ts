import { Component, Output, EventEmitter } from '@angular/core';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'counts-and-totals',
    templateUrl: './counts-and-totals.component.html',
    styleUrls: ['./counts-and-totals.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class CountsAndTotalsComponent {
    @Output() onDataLoaded = new EventEmitter();
    data = {};
    fields: any;

    constructor(
        private _dashboardService: DashboardWidgetsService,
        public ls: AppLocalizationService
    ) {
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

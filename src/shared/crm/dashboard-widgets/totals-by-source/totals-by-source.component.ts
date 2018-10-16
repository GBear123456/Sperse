import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: []
})
export class TotalsBySourceComponent extends AppComponentBase implements OnInit {
    totalsData: any;
    totalCount = 0;

    rangeColors = [
        '#F9B65C', '#98D66B', '#ED9757', '#5baae0'
    ];

    percentage: string;
    rangeCount: number;
    rangeName: string;
    rangeColor: string;

    constructor(
        injector: Injector,
        private _dashboardWidgetsService: DashboardWidgetsService,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _dashboardWidgetsService.subscribePeriodChange((period) => {
            this.startLoading();
            _dashboardServiceProxy.getCustomersByCompanySize(
                period && period.from, period && period.to)
                    .pipe(finalize(() => {this.finishLoading();})).subscribe((result) => {
                        this.totalCount = 0;
                        this.totalsData = result.sort((a, b) => {
                            return (parseInt(a.companySizeRange) || Infinity) >
                                (parseInt(b.companySizeRange) || Infinity) ? 1 : -1;
                        });
                        this.totalsData.forEach((item) => {
                            if (!item.companySizeRange)
                                item.companySizeRange = 'Unknown';
                            this.totalCount += item.customerCount;
                        });
                    }
            );
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
        return {
            color: this.rangeColors[data.index]
        };
    }

    onPointHoverChanged($event) {
        let isHoverIn = $event.target.fullState, item = $event.target;
        this.percentage = isHoverIn ? (item.percent * 100).toFixed(1) + '%' : '';
        this.rangeCount = (isHoverIn ? item.initialValue : this.totalCount).toLocaleString('en');
        this.rangeColor = isHoverIn ? this.rangeColors[item.index] : undefined;
        this.rangeName = item.argument;
    }
}

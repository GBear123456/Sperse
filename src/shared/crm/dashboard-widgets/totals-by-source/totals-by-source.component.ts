import { AfterViewInit, Component, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { DxPieChartComponent } from 'devextreme-angular/ui/pie-chart';
import { AppConsts } from '@shared/AppConsts';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'totals-by-source',
    templateUrl: './totals-by-source.component.html',
    styleUrls: ['./totals-by-source.component.less'],
    providers: []
})
export class TotalsBySourceComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild(DxPieChartComponent) chartComponent: DxPieChartComponent;
    totalsData: any;
    totalCount = 0;

    rangeColors = [
        '#00aeef',
        '#8487e7',
        '#86c45d',
        '#f7d15e',
        '#ecf0f3'
    ];

    percentage: string;
    rangeCount: number;
    rangeName: string;
    rangeColor: string;
    totalNumbersTop: string;
    renderInterval;
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
                    .pipe(finalize(() => { this.finishLoading(); })).subscribe((result) => {
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
                        setTimeout(() => { this.render(); }, 300);
                    }
            );
        });
    }

    ngAfterViewInit() {
        this.render();
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

    render() {
        this.renderInterval = setInterval(() => {
            if (this.chartComponent) {
                this.chartComponent.instance.render();
                clearInterval(this.renderInterval);
            }
        }, 100);
    }

    onDrawn(e) {
        this.updatePieChartTopPositions(e);
    }

    private updatePieChartTopPositions(e) {
        const componentTop = this.getElementRef().nativeElement.getBoundingClientRect().top;
        const circleBoundingRect = e.component.getAllSeries()[0]._group.element.getBoundingClientRect();
        const circleTop = circleBoundingRect.top;
        const circleCenterY = (circleTop - componentTop) + circleBoundingRect.height / 2;
        this.totalNumbersTop = circleCenterY - 55 + 'px';
    }
}

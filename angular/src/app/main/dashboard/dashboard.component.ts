import { Component, Injector, AfterViewInit } from '@angular/core';
import { TenantDashboardServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './dashboard.component.html',
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends AppComponentBase implements AfterViewInit {

    constructor(
        injector: Injector,
        private _dashboardService: TenantDashboardServiceProxy
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        
        Morris.Area({
            element: 'sales_statistics',
            padding: 0,
            behaveLikeLine: false,
            gridEnabled: false,
            //gridLineColor: false,
            axes: false,
            fillOpacity: 1,
            data: [
                {
                    period: '2011 Q1',
                    sales: 1400,
                    profit: 400
                }, {
                    period: '2011 Q2',
                    sales: 1100,
                    profit: 600
                }, {
                    period: '2011 Q3',
                    sales: 1600,
                    profit: 500
                }, {
                    period: '2011 Q4',
                    sales: 1200,
                    profit: 400
                }, {
                    period: '2012 Q1',
                    sales: 1550,
                    profit: 800
                }
            ],
            lineColors: ['#399a8c', '#92e9dc'],
            xkey: 'period',
            ykeys: ['sales', 'profit'],
            labels: ['Sales', 'Profit'],
            pointSize: 0,
            lineWidth: 0,
            hideHover: 'auto',
            resize: true
        });

        this.getMemberActivity();
    }

    getMemberActivity(): void {
        this._dashboardService
            .getMemberActivity()
            .subscribe(result => {
                $("#totalMembersChart").sparkline(result.totalMembers, {
                    type: 'bar',
                    width: '100',
                    barWidth: 6,
                    height: '45',
                    barColor: '#F36A5B',
                    negBarColor: '#e02222',
                    chartRangeMin: 0
                });

                $("#newMembersChart").sparkline(result.newMembers, {
                    type: 'bar',
                    width: '100',
                    barWidth: 6,
                    height: '45',
                    barColor: '#5C9BD1',
                    negBarColor: '#e02222',
                    chartRangeMin: 0
                });
            });
    };
}
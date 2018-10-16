import { Component, OnInit, Injector } from '@angular/core';
import { TotalsByPeriodModel } from './totals-by-period.model';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DashboardServiceProxy, GroupBy, GroupBy2 } from 'shared/service-proxies/service-proxies';
import { DashboardWidgetsService } from '../dashboard-widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
    selector: 'totals-by-period',
    templateUrl: './totals-by-period.component.html',
    styleUrls: ['./totals-by-period.component.less'],
    providers: [ DashboardServiceProxy ]
})
export class TotalsByPeriodComponent extends AppComponentBase implements OnInit {
    totalsData: any = [];
    startDate: any;
    endDate: any;
    chartWidth = 650;
    currency = 'USD';

    clientColor = '#00aeef';
    leadColor = '#54e4c9';

    periods: TotalsByPeriodModel[] = [
         {
             key: GroupBy.Daily,
             name: 'Daily',
             text: `30 ${this.ls('Platform', 'Periods_Day_plural')}`,
             amount: 30
         },
         {
             key: GroupBy.Weekly,
             name: 'Weekly',
             text: `15 ${this.ls('Platform', 'Periods_Week_plural')}`,
             amount: 15
        },
        {
            key: GroupBy.Monthly,
            name: 'Monthly',
            text: `12 ${this.l('Periods_Month_plural')}`,
            amount: 12
        }
    ];
    selectedPeriod: TotalsByPeriodModel = this.periods.find(period => period.name === 'Daily');

    constructor(injector: Injector,
        private _dashboardServiceProxy: DashboardServiceProxy,
        private _dashboardWidgetsService: DashboardWidgetsService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this._dashboardWidgetsService.subscribePeriodChange((period) => {
            if (period) {
                if ([this.l('Today'), this.l('Yesterday'), this.l('This_Week'), this.l('This_Month'), this.l('Last_Month')].indexOf(period.name) >= 0)
                    this.selectedPeriod = this.periods[0];
                else
                    this.selectedPeriod = this.periods[2];
            }
            this.startLoading();
            this._dashboardServiceProxy.getCustomerAndLeadStats(GroupBy2[this.selectedPeriod.name],
                 this.selectedPeriod.amount, false).pipe(finalize(() => {this.finishLoading();})).subscribe((result) => {
                     this.totalsData = result;
                 });
        });
    }

    getPeriodBottomAxisCustomizer(period: string) {
        return this[`get${this.capitalize(period)}BottomAxisCustomizer`];
    }

    /** Replace minus for the brackets */
    customizeAxisValues = (arg: any) => {
        return arg.valueText;
    }

    customizeBottomAxis = (elem) => {
        return this.getPeriodBottomAxisCustomizer(this.selectedPeriod.name)(elem);
    }

    /** Factory for method that customize axis */

    getMonthlyBottomAxisCustomizer(elem) {
        return `${elem.valueText.substring(0, 3).toUpperCase()}<br/><div class="yearArgument">${elem.value.getFullYear().toString().substr(-2)}</div>`;
    }

    getWeeklyBottomAxisCustomizer(elem) {
        return `${elem.value.getDate()}.${elem.value.getMonth() + 1}`;
    }

    getDailyBottomAxisCustomizer(elem) {
        return elem.value.toDateString().split(' ').splice(1, 2).join(' ');
    }

    onDrawn($event) {
        setTimeout(() => $event.component.render(), 1000);
    }
}

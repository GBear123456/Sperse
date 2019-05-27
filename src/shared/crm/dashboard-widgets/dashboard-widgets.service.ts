import { Injectable } from '@angular/core';
import { Subscription, Observable, ReplaySubject } from 'rxjs';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { GetTotalsOutput } from '@shared/service-proxies/service-proxies';

@Injectable()
export class DashboardWidgetsService  {
    private _period: ReplaySubject<PeriodModel> = new ReplaySubject<PeriodModel>(1);
    private _totalsData: ReplaySubject<GetTotalsOutput> = new ReplaySubject<GetTotalsOutput>(1);
    private _subscribers: Array<Subscription> = [];
    public period$: Observable<Object> = this._period.asObservable();
    totalsDataFields = [
        {
            title: 'Sales',
            color: '#8487e7',
            name: 'totalOrderAmount',
            type: 'currency',
            percent:  '0%'
        }, {
            title: 'Leads',
            color: '#00aeef',
            name: 'totalLeadCount',
            type: 'number',
            percent: '0%'
       }, {
           title: 'Clients',
           color: '#f4ae55',
           name: 'totalClientCount',
           type: 'number',
           percent: '0%'
       }];

    constructor(
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {}

    subscribePeriodChange(callback: (period: any) => any) {
        this._subscribers.push(
            this.period$.subscribe(callback)
        );
    }

    periodChanged(period?: PeriodModel) {
        this._period.next(period);
        this._dashboardServiceProxy.getTotals(period && period.from, period && period.to)
            .subscribe(result => {
                this._totalsData.next(result);
            }
       );
    }

    subscribeTotalsData(callback: (period: Object) => any) {
        this._subscribers.push(
            this._totalsData.asObservable().subscribe(callback)
        );
    }

    getPercentage(value, total) {
        return (total ? Math.round(value / total * 100) : 0)  + '%';
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }
}

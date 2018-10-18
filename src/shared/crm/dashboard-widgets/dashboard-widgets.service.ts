import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';

@Injectable()
export class DashboardWidgetsService  {
    private _period: Subject<Object> = new Subject<Object>();
    private _totalsData: Subject<Object>;
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

    constructor(injector: Injector,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        this._totalsData = new Subject<Object>();
    }

    subscribePeriodChange(callback: (period: any) => any) {
        this._subscribers.push(
            this.period$.subscribe(callback)
        );
    }

    periodChanged(period = undefined) {
        this._period.next(period);
        this._dashboardServiceProxy.getTotals(
            period && period.from, period && period.to)
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

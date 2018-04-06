import { Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

import { DashboardServiceProxy } from 'shared/service-proxies/service-proxies';

@Injectable()
export class DashboardWidgetsService  {
    private _period: Subject<Object>;
    private _totalsData: Subject<Object>;
    private _subscribers: Array<Subscription> = [];

    totalsDataFields = [
        {
            title: 'Sales', 
            color: '#8484ea', 
            name: 'totalOrderAmount', 
            type: 'currency', 
            percent:  '0%'
        }, {
            title: 'Leads', 
            color: '#54e4c9', 
            name: 'totalLeadCount', 
            type: 'number', 
            percent: '0%'
       }, {
           title: 'Clients', 
           color: '#5baae0', 
           name: 'totalClientCount', 
           type: 'number', 
           percent: '0%'
       }];

    constructor(injector: Injector,
        private _dashboardServiceProxy: DashboardServiceProxy
    ) {
        this._totalsData = new Subject<Object>();
        this._period = new Subject<Object>();
    }

    subscribePeriodChange(callback: (period: Object) => any) {
        this._subscribers.push(
            this._period.asObservable().subscribe(callback)
        );
    }

    periodChanged(period = undefined) {
        let from = period && period.from;
        let to = period && period.to;
        this._period.next(from, to);
        this._dashboardServiceProxy.getTotals(from, to)
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
        return (total ? Math.round(value / total * 100): 0)  + '%';
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }    
}
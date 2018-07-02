import { Injectable, Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';

@Injectable()
export class DashboardService  {
    private _period: Subject<Object>;
    private _subscribers: Array<Subscription> = [];

    constructor(injector: Injector) {
        this._period = new Subject<Object>();
    }

    subscribePeriodChange(callback: (period: Object) => any) {
        this._subscribers.push(
            this._period.asObservable().subscribe(callback)
        );
    }

    periodChanged(period) {
        this._period.next(period);
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }

}

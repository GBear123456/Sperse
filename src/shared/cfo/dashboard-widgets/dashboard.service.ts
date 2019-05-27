import { Injectable } from '@angular/core';
import { ReplaySubject, Subscription } from 'rxjs';
import { PeriodModel } from '@app/shared/common/period/period.model';
import { Observable } from '@node_modules/rxjs';
import { distinctUntilChanged } from '@node_modules/rxjs/internal/operators';

@Injectable()
export class DashboardService  {
    private _period: ReplaySubject<PeriodModel> = new ReplaySubject(1);
    period$: Observable<PeriodModel> = this._period.asObservable().pipe(distinctUntilChanged());
    private _subscribers: Array<Subscription> = [];

    subscribePeriodChange(callback: (period: PeriodModel) => any) {
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

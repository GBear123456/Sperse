/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import { PeriodModel } from '@app/shared/common/period/period.model';
import { PeriodService } from '@app/shared/common/period/period.service';

@Injectable()
export class DashboardService {
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject(this.periodService.selectedPeriod);
    period$: Observable<PeriodModel> = this._period.asObservable().pipe(distinctUntilChanged());

    refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this.refresh.asObservable();

    private _subscribers: Array<Subscription> = [];

    constructor(
        private periodService: PeriodService
    ) {}

    subscribePeriodChange(callback: (period: PeriodModel) => any) {
        this._subscribers.push(
            this._period.asObservable().subscribe(callback)
        );
    }

    periodChanged(period: string) {
        this._period.next(this.periodService.getDatePeriodFromName(period));
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }

}

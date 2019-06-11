/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/** Application imports */
import { PeriodModel } from '@app/shared/common/period/period.model';
import { PeriodService } from '@app/shared/common/period/period.service';

@Injectable()
export class DashboardService {
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject(this.periodService.selectedPeriod);
    period$: Observable<PeriodModel> = this._period.asObservable().pipe(distinctUntilChanged());

    private _refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor(
        private periodService: PeriodService
    ) {}

    refresh() {
        this._refresh.next(null);
    }

    periodChanged(period: string) {
        this._period.next(this.periodService.getDatePeriodFromName(period));
    }

}

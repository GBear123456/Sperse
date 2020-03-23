/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';

/** Application imports */
import { PeriodModel } from '@app/shared/common/period/period.model';
import { PeriodService } from '@app/shared/common/period/period.service';
import { DailyStatsPeriodModel } from '@shared/cfo/dashboard-widgets/accounts/daily-stats-period.model';
import { Period } from '@app/shared/common/period/period.enum';

@Injectable()
export class DashboardService {

    private _refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor() {}

    refresh() {
        this._refresh.next(null);
    }

}

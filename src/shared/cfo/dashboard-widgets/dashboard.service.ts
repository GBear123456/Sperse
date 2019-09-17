/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { PeriodModel } from '@app/shared/common/period/period.model';
import { PeriodService } from '@app/shared/common/period/period.service';
import { DailyStatsPeriodModel } from '@shared/cfo/dashboard-widgets/accounts/daily-stats-period.model';
import { Period } from '@app/shared/common/period/period.enum';

@Injectable()
export class DashboardService {
    private _period: BehaviorSubject<PeriodModel> = new BehaviorSubject(this.periodService.selectedPeriod);
    period$: Observable<PeriodModel> = this._period.asObservable().pipe(distinctUntilChanged());

    dailyStatsPeriod$: Observable<DailyStatsPeriodModel> = this.period$.pipe(
        map((period: PeriodModel) => DashboardService.getDailyStatsPeriod(period))
    );

    private _refresh: BehaviorSubject<any> = new BehaviorSubject<null>(null);
    refresh$: Observable<null> = this._refresh.asObservable();

    constructor(
        private periodService: PeriodService
    ) {}

    static getDailyStatsPeriod(period: PeriodModel): DailyStatsPeriodModel {
        let currentDate = moment().utc().startOf('day');
        let result = {
            startDate: null,
            endDate: currentDate
        };
        if (period) {
            result.startDate = period.from ? period.from.startOf('day') : null;
            result.endDate = period.to ? period.to.startOf('day') : null;

            result.endDate = !result.endDate || currentDate.isBefore(result.endDate) ? currentDate : result.endDate;
            result.startDate = result.startDate && result.endDate.isBefore(result.startDate) ? result.endDate : result.startDate;
        }
        return result;
    }

    refresh() {
        this._refresh.next(null);
    }

    periodChanged(period: Period) {
        this._period.next(this.periodService.getDatePeriod(period));
    }

}

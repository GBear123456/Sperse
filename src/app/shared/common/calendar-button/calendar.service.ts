/** Core imports */
import { Inject, Injectable, Optional } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { Period } from '@app/shared/common/period/period.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class CalendarService {
    dateRange: BehaviorSubject<CalendarValuesModel> = new BehaviorSubject<CalendarValuesModel>(
        this.defaultPeriod === Period.LastQuarter
            ? {
                from: { value: DateHelper.addTimezoneOffset(moment().subtract(1, 'quarter').startOf('quarter').toDate(), true) },
                to: { value: DateHelper.addTimezoneOffset(moment().subtract(1, 'quarter').endOf('quarter').toDate(), true) },
                period: Period.LastQuarter
            }
            : {
                from: { value: DateHelper.addTimezoneOffset(moment().startOf('isoWeek').toDate(), true) },
                to: { value: DateHelper.addTimezoneOffset(moment().endOf('isoWeek').toDate(), true) },
                period: Period.ThisWeek
            }
    );
    dateRange$: Observable<CalendarValuesModel> = this.dateRange.asObservable();
    periodLabel$: Observable<string> = this.dateRange$.pipe(
        map((dateRange: CalendarValuesModel) => {
            return dateRange && dateRange.period ? this.ls.l('Periods_' + dateRange.period) : (
                dateRange && dateRange.from.value || dateRange.to.value ?
                    [this.formatDate(dateRange.from.value), '-', this.formatDate(dateRange.to.value)].filter(Boolean).join(' ') :
                    (this.defaultPeriod === Period.LastQuarter
                        ? this.ls.l('Periods_LastQuarter')
                        : this.ls.l('Periods_ThisYear')
                    )
            );
        })
    );
    constructor(
        private ls: AppLocalizationService,
        @Inject('defaultPeriod') @Optional() private defaultPeriod?: Period
    ) { }

    private formatDate(date: Date): string {
        return date ? date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        }) : null;
    }
}
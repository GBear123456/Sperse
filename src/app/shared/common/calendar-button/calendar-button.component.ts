/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import lowerFirst from 'lodash/lowerFirst';
import * as moment from 'moment';

/** Application imports */
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { CalendarService } from '@app/shared/common/calendar-button/calendar.service';

@Component({
    selector: 'calendar-button',
    templateUrl: './calendar-button.component.html',
    styleUrls: ['./calendar-button.component.less']
})
export class CalendarButtonComponent {
    @Input() emptyEndDateIsAvailable = false;
    periodLabel$: Observable<string> = this.calendarService.periodLabel$.pipe(
        withLatestFrom(this.calendarService.dateRange$),
        map(([label, dateRange]: [string, CalendarValuesModel]) => {
            return this.emptyEndDateIsAvailable && dateRange.from.value && !dateRange.to.value ? label + ' -' : label;
        })
    );
    constructor(
        private dialog: MatDialog,
        private calendarService: CalendarService
    ) {}

    openCalendarDialog() {
        if (!this.dialog.getDialogById('calendarDialog')) {
            this.dialog.open(CalendarDialogComponent, {
                panelClass: 'slider',
                id: 'calendarDialog',
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {
                    to: { value: this.calendarService.dateRange.value && new Date(this.calendarService.dateRange.value.to.value) },
                    from: { value: this.calendarService.dateRange.value && new Date(this.calendarService.dateRange.value.from.value) },
                    options: {
                        allowFutureDates: true,
                        endDate: moment(new Date()).add(10, 'years').toDate(),
                        rangeSelectedPeriod: lowerFirst(this.calendarService.dateRange.value.period)
                    }
                }
            }).afterClosed().pipe(
                filter(Boolean)
            ).subscribe((dateRange: any) => {
                this.calendarService.dateRange.next({
                    from: { value: dateRange.dateFrom },
                    to: { value: dateRange.dateTo },
                    period: dateRange.period
                });
            });
        }
    }

}

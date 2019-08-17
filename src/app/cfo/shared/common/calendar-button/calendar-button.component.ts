/** Core imports */
import { Component, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import * as moment from 'moment';

/** Application imports */
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';

@Component({
    selector: 'calendar-button',
    templateUrl: './calendar-button.component.html',
    styleUrls: ['./calendar-button.component.less']
})
export class CalendarButtonComponent {
    @Input() emptyEndDateIsAvailable = false;
    periodLabel$: Observable<string> = this.cfoPreferencesService.periodLabel$.pipe(
        withLatestFrom(this.cfoPreferencesService.dateRange$),
        map(([label, dateRange]: [string, CalendarValuesModel]) => {
            return this.emptyEndDateIsAvailable && dateRange.from.value && !dateRange.to.value ? label + ' -' : label;
        })
    );
    constructor(
        private dialog: MatDialog,
        private cfoPreferencesService: CfoPreferencesService
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
                    to: { value: this.cfoPreferencesService.dateRange.value && new Date(this.cfoPreferencesService.dateRange.value.to.value) },
                    from: { value: this.cfoPreferencesService.dateRange.value && new Date(this.cfoPreferencesService.dateRange.value.from.value) },
                    options: {
                        allowFutureDates: true,
                        endDate: moment(new Date()).add(10, 'years').toDate()
                    }
                }
            }).afterClosed().pipe(
                filter(Boolean)
            ).subscribe((dateRange) => {
                this.cfoPreferencesService.dateRange.next({
                    from: { value: dateRange.dateFrom },
                    to: { value: dateRange.dateTo },
                    period: dateRange.period
                });
            });
        }
    }

}

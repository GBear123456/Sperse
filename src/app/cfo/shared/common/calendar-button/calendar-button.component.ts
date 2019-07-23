/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { filter } from 'rxjs/operators';

/** Application imports */
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';

@Component({
    selector: 'calendar-button',
    templateUrl: './calendar-button.component.html',
    styleUrls: ['./calendar-button.component.less']
})
export class CalendarButtonComponent {

    constructor(
        private dialog: MatDialog,
        public cfoPreferencesService: CfoPreferencesService
    ) {}

    openCalendarDialog() {
        this.dialog.open(CalendarDialogComponent, {
            panelClass: 'slider',
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                to: { value: this.cfoPreferencesService.dateRange.value && this.cfoPreferencesService.dateRange.value.to.value },
                from: { value: this.cfoPreferencesService.dateRange.value && this.cfoPreferencesService.dateRange.value.from.value },
                options: {}
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

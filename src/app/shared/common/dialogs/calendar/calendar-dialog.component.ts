import { Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: 'calendar-dialog.component.html',
  styleUrls: ['calendar-dialog.component.less']
})
export class CalendarDialogComponent {
    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        dialogRef: MatDialogRef<CalendarDialogComponent, any>
    ) {

    }
}
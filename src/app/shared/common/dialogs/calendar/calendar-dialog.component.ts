/** Core imports */
import { Component, Inject, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
  templateUrl: 'calendar-dialog.component.html',
  styleUrls: [
      '../../../../../shared/common/styles/close-button.less',
      'calendar-dialog.component.less'
  ]
})
export class CalendarDialogComponent implements OnInit, AfterViewInit {
    private slider: any;
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService,
        public dialogRef: MatDialogRef<CalendarDialogComponent, any>,
        public elementRef: ElementRef
    ) {
        dialogRef.beforeClosed().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '75px',
                    right: '0px'
                });
            }, 100);
        });
    }

    filterApply(event) {
        this.dialogRef.close({
            dateFrom: this.data.from.value || undefined,
            dateTo: this.data.to.value || undefined,
            period: this.data.period
        });
    }
}

import { Component, AfterViewInit, OnDestroy, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';

let JQCalendarInit = require('jquery-calendar');

@Component({
    selector: 'calendar',
    templateUrl: 'calendar.component.html',
    styleUrls: ['calendar.component.less']
})
export class CalendarComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    UID: String = Math.random().toString(36).substring(2);
    calendar: any;

    private _values: any;
    @Input()
    set values(values: any) {
        this._values = values;
        this.setDateRageValues();
    }

    @Output() onChange = new EventEmitter();

    constructor(injector: Injector) {
        super(injector);
    }

    private setDateRageValues() {
        if (this.calendar) {
            let dateRange = this.calendar.data('dateRangePicker');
            if (this._values.from.value || this._values.to.value)
                dateRange.setDateRange(this._values.from.value || this._values.to.value,
                    this._values.to.value || this._values.from.value
                );
        }
    }

    ngAfterViewInit() {
        this.calendar = JQCalendarInit('.calendar#' + this.UID, true);
        this.calendar.on('datepicker-first-date-selected',
            (event, obj) => {
                this._values.from.value = obj.date1;
            }
        ).on('datepicker-change',
            (event, obj) => {
                this._values.from.value = obj.date1;
                this._values.to.value = obj.date2;
            }
            );
        this.setDateRageValues();
    }

    ngOnDestroy() {
        this.calendar.off('datepicker-change');
        this.calendar.off('datepicker-first-date-selected');
        this.calendar.data('dateRangePicker').destroy();
    }
}

import { Component, AfterViewInit, OnDestroy, Injector, Input, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';
import * as moment from 'moment-timezone';
import * as JQCalendarInit from 'jquery-calendar';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'calendar',
    templateUrl: 'calendar.component.html',
    styleUrls: ['calendar.component.less']
})
export class CalendarComponent extends AppComponentBase implements AfterViewInit, OnDestroy {
    UID: String = Math.random().toString(36).substring(2);
    calendar: any;

    private _options: any;
    @Input()
    set options(options: any) {
        this._options = options;
    }

    private _values: CalendarValuesModel;
    @Input()
    set values(values: CalendarValuesModel) {
        this._values = values;
        this.setDateRageValues();
    }

    @Output() onChange = new EventEmitter();

    constructor(injector: Injector) {
        super(injector);

        moment.tz.setDefault(undefined);
        window['getUserTimezoneDate'] = (date: Date) => {
            DateHelper.addTimezoneOffset(date, true);
            return date;
        };
    }

    private setDateRageValues() {
        if (this.calendar) {
            let dateRange = this.calendar.data('dateRangePicker');
            if (this._values.from.value || this._values.to.value) {
                dateRange.setDateRange(
                    new Date((this._values.from.value || this._values.to.value).getTime()),
                    new Date((this._values.to.value || this._values.from.value).getTime())
                );
            }
        }
    }

    ngAfterViewInit() {
        this.calendar = JQCalendarInit(
            '.calendar#' + this.UID, true, this._options);
        this.calendar.on('datepicker-first-date-selected',
            (event, obj) => {
                this._values.from.value = new Date(obj.date1.getTime());
                this._values.to.value = null;
            }
        ).on('datepicker-change',
            (event, obj) => {
                this._values.from.value = new Date(obj.date1.getTime());
                this._values.to.value = new Date(obj.date2.getTime());
                this._values.period = this.calendar.data('dateRangePicker').getRangeSelectedPeriod();
                this.onChange.emit(this._values);
            }
        );
        this.setDateRageValues();
    }

    ngOnDestroy() {
        this.calendar.off('datepicker-change');
        this.calendar.off('datepicker-first-date-selected');
        this.calendar.data('dateRangePicker').destroy();

        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);
    }
}

import { Injectable } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import * as moment from 'moment';

@Injectable()
export class DateTimeService  {

    constructor(private ls: AppLocalizationService) {}

    createDateRangePickerOptions(): any {
        let options = {
            locale: {
                format: 'L',
                applyLabel: this.ls.l('Apply'),
                cancelLabel: this.ls.l('Cancel'),
                customRangeLabel: this.ls.l('CustomRange')
            },
            min: moment('2015-05-01'),
            minDate: moment('2015-05-01'),
            max: moment(),
            maxDate: moment(),
            opens: 'left',
            ranges: {}
        };

        options.ranges[this.ls.l('Today')] = [moment().startOf('day'), moment().endOf('day')];
        options.ranges[this.ls.l('Yesterday')] = [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')];
        options.ranges[this.ls.l('LastSevenDays')] = [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')];
        options.ranges[this.ls.l('LastThirtyDays')] = [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')];
        options.ranges[this.ls.l('ThisMonth')] = [moment().startOf('month'), moment().endOf('month')];
        options.ranges[this.ls.l('LastMonth')] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];

        return options;
    }

    formatDate(date: Date, format: string): string {
        return moment(date).format(format);
    }

    fromISODateString(date: string): moment {
        return moment(date);
    }
}
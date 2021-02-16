import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({
  name: 'datetime'
})
export class DateTimePipe implements PipeTransform {
    transform(value: string | moment.Moment, format: string): any {
        return moment(value).tz(abp.timing.timeZoneInfo.iana.timeZoneId).format(format);
    }
}
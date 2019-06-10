import * as moment from 'moment';

export class DateHelper {

    static addTimezoneOffset(date: Date, addUserOffset = false): Date {
        const momentOffset = addUserOffset ? DateHelper.getUserOffset(date) : 0;
        date.setTime(date.getTime() + (date.getTimezoneOffset() + momentOffset) * 60 * 1000);
        return date;
    }

    static removeTimezoneOffset(date: Date, removeUserOffset = false, setTime?: string | 'to' | 'from'): Date {
        setTime && Date.prototype.setHours.apply(date,
            setTime == 'to' ? [23, 59, 59, 999] : [0, 0, 0, 0]);

        const momentOffset = removeUserOffset ? DateHelper.getUserOffset(date) : 0;
        date.setTime(date.getTime() - (date.getTimezoneOffset() + momentOffset) * 60 * 1000);
        return date;
    }

    static getUserOffset(date: Date): number {
        return moment(date).tz(abp.timing.timeZoneInfo.iana.timeZoneId).utcOffset();
    }

    static getCurrentUtcDate(): moment.Moment {
        return moment.tz(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY', 'utc');
    }

}

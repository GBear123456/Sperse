import * as moment from 'moment-timezone';

export class DateHelper {
    static isSameDateWithoutTime(date1: Date, date2: Date): Boolean {
        return date1.toLocaleDateString('en-US') == date2.toLocaleDateString('en-US');
    }

    static getDateWithoutTime(date: moment): moment {
        return moment(date).utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }

    static addTimezoneOffset(date: Date, addUserOffset = false, ianaTimezone = null): Date {
        const momentOffset = addUserOffset ? DateHelper.getUserOffset(date) :
            ianaTimezone ? DateHelper.getCustomTimezoneOffset(date, ianaTimezone) : 0;
        date.setTime(date.getTime() + (date.getTimezoneOffset() + momentOffset) * 60 * 1000);
        return date;
    }

    static removeTimezoneOffset(date: Date, removeUserOffset = false, setTime?: string | 'to' | 'from', ianaTimezone = null): Date {
        setTime && Date.prototype.setHours.apply(date,
            setTime == 'to' ? [23, 59, 59, 999] : [0, 0, 0, 0]);

        const momentOffset = removeUserOffset ? DateHelper.getUserOffset(date) :
            ianaTimezone ? DateHelper.getCustomTimezoneOffset(date, ianaTimezone) : 0;
        date.setTime(date.getTime() - (date.getTimezoneOffset() + momentOffset) * 60 * 1000);
        return date;
    }

    static getUserOffset(date: Date): number {
        return DateHelper.getCustomTimezoneOffset(date, abp.timing.timeZoneInfo.iana.timeZoneId);
    }

    static getCustomTimezoneOffset(date: Date, ianaTimezone: string): number {
        return moment(date).tz(ianaTimezone).utcOffset();
    }

    static getUserTimezone(): string {
        return moment().tz(abp.timing.timeZoneInfo.iana.timeZoneId).format('ZZ');
    }

    /**
     * Returns moment with user date in utc timezone without hours, minutes and seconds
     * @return {moment.Moment}
     */
    static getCurrentUtcDate(): moment.Moment {
        return moment.tz(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY', 'utc');
    }

    /**
     * Gets quarter from the date
     * @param date
     * @returns {number}
     */
    static getQuarter(date: Date = new Date()) {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    static getStartDate(date: Date) {
        let startDate;
        if (date) {
            const periodFrom = DateHelper.getDateWithoutTime(DateHelper.removeTimezoneOffset(new Date(date)));
            startDate = periodFrom.isAfter(moment.utc()) ? moment.utc().startOf('day') : periodFrom;
        }
        return startDate;
    }

    static getEndDate(date: Date) {
        const periodTo = date && DateHelper.getDateWithoutTime(DateHelper.removeTimezoneOffset(new Date(date)));
        return date
            ? periodTo.isAfter(moment.utc()) ? moment.utc().startOf('day') : periodTo
            : moment.utc().startOf('day');
    }
}
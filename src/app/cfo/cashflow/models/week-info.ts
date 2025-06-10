import * as moment from 'moment';
export class WeekInfo {
    startDate: moment.Moment;
    endDate: moment.Moment;
    weekNumber: number;
    constructor(date: moment.Moment) {
        let weekPeriod: any = 'isoWeek';
        const startOfWeek = moment(date).startOf(weekPeriod);
        const startOfMonth = moment(date).startOf('month');
        this.startDate = startOfWeek.isSameOrAfter(startOfMonth) ? startOfWeek : startOfMonth;
        const endOfWeek = moment(date).endOf(weekPeriod);
        const endOfMonth = moment(date).endOf('month');
        this.endDate = endOfWeek.isSameOrBefore(endOfMonth) ? endOfWeek : endOfMonth;
        const isoWeek = date.isoWeek();
        const dateMonth = date.month();
        /** moment.isoWeek return 52 for starting days of some years and 1 for ending days */
        if (dateMonth === 0 && isoWeek > 50) {
            this.weekNumber = 0;
        } else if (dateMonth === 11 && isoWeek === 1) {
            this.weekNumber = 53;
        } else {
            this.weekNumber = isoWeek;
        }
    }
}

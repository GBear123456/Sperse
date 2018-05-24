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
        this.weekNumber = date.isoWeek();
    }
}

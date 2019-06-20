import * as moment from 'moment';

export class PeriodModel {
    name: string;
    period: string;
    from: moment.Moment;
    to: moment.Moment;
}

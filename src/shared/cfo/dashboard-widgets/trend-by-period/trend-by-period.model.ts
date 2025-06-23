import { GroupByPeriod } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';

export class TrendByPeriodModel {
    key: GroupByPeriod;
    name: string;
    amount: number;
    startDate?: moment.Moment;
    endDate?: moment.Moment;
}

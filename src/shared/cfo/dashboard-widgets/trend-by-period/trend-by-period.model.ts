import { GroupBy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';

export class TrendByPeriodModel {
    key: GroupBy;
    name: string;
    text: string;
    amount: number;
    startDate?: moment.Moment;
    endDate?: moment.Moment;
}

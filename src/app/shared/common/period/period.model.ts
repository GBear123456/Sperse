import * as moment from 'moment';
import { Period } from '@app/shared/common/period/period.enum';

export class PeriodModel {
    name: string;
    period: Period;
    from: moment.Moment;
    to: moment.Moment;
}

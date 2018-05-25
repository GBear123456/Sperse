import { TransactionStatsDto } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
export class TransactionStatsDtoExtended extends TransactionStatsDto {
    initialDate: moment.Moment;
}

import { GroupByPeriod } from '@shared/service-proxies/service-proxies';

export class TotalsByPeriodModel {
    key: GroupByPeriod;
    name: string;
    text: string;
    amount: number;
}

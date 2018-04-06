import { GroupBy } from '@shared/service-proxies/service-proxies';

export class TotalsByPeriodModel {
    key: GroupBy;
    name: string;
    text: string;
    amount: number;
}
import { TransactionStatsDto } from '@shared/service-proxies/service-proxies';
export class TransactionStatsDtoExtended extends TransactionStatsDto {
    initialDate: any;
    categorization: { [categoryId: string]: string };
    levels: { [level: string]: string };
    isStub: boolean;
    accountingTypeId: number;
    constructor(data: any) {
        super(data);
    }
}
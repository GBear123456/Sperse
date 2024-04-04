import { TransactionDto } from '@app/crm/reports/transction-dto';

export interface SubscriptionTrackerDto {
    ContactId: number;
    Email: string;
    AffiliateCodes: string[];
    FirstName: string;
    LastName: string;
    FullName: string;
    TotalRevenue: number;
    TotalRefunds: number;
    NetCollected: number;
    Transactions: TransactionDto[];
}
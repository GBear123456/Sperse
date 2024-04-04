import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { SubscriptionTrackerDto } from '@app/crm/reports/subscription-tracker-dto';

export const SubscriptionTrackerFields: KeysEnum<SubscriptionTrackerDto> = {
    ContactId: 'ContactId',
    Email: 'Email',
    AffiliateCodes: 'AffiliateCodes',
    FirstName: 'FirstName',
    LastName: 'LastName',
    FullName: 'FullName',
    TotalRevenue: 'TotalRevenue',
    TotalRefunds: 'TotalRefunds',
    NetCollected: 'NetCollected',
    Transactions: 'Transactions'
};
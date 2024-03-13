import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { LedgerDto } from '@app/crm/commission-history/ledger-dto';

export const LedgerFields: KeysEnum<LedgerDto> = {
    AffiliateCode: 'AffiliateCode',
    ContactId: 'ContactId',
    ContactName: 'ContactName',
    EmailAddress: 'EmailAddress',
    EndDate: 'EndDate',
    EntryDate: 'EntryDate',
    Id: 'Id',
    StartDate: 'StartDate',
    Status: 'Status',
    TotalAmount: 'TotalAmount',
    CurrencyId: 'CurrencyId',
    Type: 'Type',
    PaymentSystem: 'PaymentSystem',
    HasPayout: 'HasPayout',
    PayPalEmailAddress: 'PayPalEmailAddress',
    StripeAccountID: 'StripeAccountID'
};
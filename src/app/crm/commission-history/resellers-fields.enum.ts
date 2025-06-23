import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ResellersDto } from '@app/crm/commission-history/resellers-dto';

export const ResellersFields: KeysEnum<ResellersDto> = {
    Id: 'Id',
    AffiliateCode: 'AffiliateCode',
    AffiliateCodes: 'AffiliateCodes',
    AvailableBalance: 'AvailableBalance',
    EarnedAmount: 'EarnedAmount',
    EmailAddress: 'EmailAddress',
    FullName: 'FullName',
    PendingEarningsAmount: 'PendingEarningsAmount',
    PendingWithdrawalsAmount: 'PendingWithdrawalsAmount',
    UnaccountedEarningsAmount: 'UnaccountedEarningsAmount',
    WithdrawnAmount: 'WithdrawnAmount'
};
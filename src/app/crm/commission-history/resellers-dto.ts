export interface ResellersDto {
    Id: number;
    AffiliateCode: string;
    AffiliateCodes: string[];
    AvailableBalance: number;
    EarnedAmount: number;
    EmailAddress: string;
    FullName: string;
    PendingEarningsAmount: number;
    PendingWithdrawalsAmount: number;
    UnaccountedEarningsAmount: number;
    WithdrawnAmount: number;
}
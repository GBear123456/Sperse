export interface CouponDto {
    Id: number;
    Code: string;
    Description: string;
    Type: string;
    Value: number;
    CurrencyId: string;
    ActivationDate: Date;
    DeactivationDate?: Date;
    Duration: string;
    IsArchived: boolean;
    Created: Date;
}
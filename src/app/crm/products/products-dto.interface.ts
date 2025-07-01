import { CustomPeriodType, PriceOptionType, ProductMeasurementUnit, ProductType, RecurringPaymentFrequency } from "@shared/service-proxies/service-proxies";

export interface ProductDto {
    Id: number;
    Code: string;
    Name: string;
    Description: string;
    Group: string;
    Type: ProductType;
    CurrencyId: number;
    ThumbnailUrl: string;
    PublicName: string;
    CreateUser: boolean;
    SinglePurchaseAllowed: boolean;
    IsPublished: boolean;
    AllowCoupon: boolean;
    PublishDate: string;
    IsArchived: boolean;
    PriceOptions: PriceOption[];
}

export interface PriceOption {
    Type: PriceOptionType;
    SignupFee: number;
    Fee: number;
    Unit: ProductMeasurementUnit;
    Frequency: RecurringPaymentFrequency;
    TrialDayCount: number;
    CustomPeriodCount: number;
    CustomPeriodType: CustomPeriodType;
    GracePeriodDayCount: number;
}
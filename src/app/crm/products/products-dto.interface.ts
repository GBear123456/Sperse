<<<<<<< HEAD
import { CustomPeriodType, ProductType, RecurringPaymentFrequency } from "@shared/service-proxies/service-proxies";

export interface ProductDto {
    Id: number;
    Code: string;
    Name: string;
    Description: string;
    Group: string;
    Type: ProductType;
    Price: number;
    CurrencyId: number;
    Unit: string;
    ThumbnailUrl: string;
    PublicName: string;
    CreateUser: boolean;
    IsPublished: boolean;
    AllowCoupon: boolean;
    PublishDate: string;
    ProductSubscriptionOptions: ProductSubscriptionOption[];
}

export interface ProductSubscriptionOption {
    SignupFee: number;
    Fee: number;
    Frequency: RecurringPaymentFrequency;
    TrialDayCount: number;
    CustomPeriodCount: number;
    CustomPeriodType: CustomPeriodType;
    GracePeriodDayCount: number;
=======
import { CustomPeriodType, ProductType, RecurringPaymentFrequency } from "@shared/service-proxies/service-proxies";

export interface ProductDto {
    Id: number;
    Code: string;
    Name: string;
    Description: string;
    Group: string;
    Type: ProductType;
    Price: number;
    CurrencyId: number;
    Unit: string;
    ThumbnailUrl: string;
    PublicName: string;
    CreateUser: boolean;
    IsPublished: boolean;
    AllowCoupon: boolean;
    PublishDate: string;
    ProductSubscriptionOptions: ProductSubscriptionOption[];
}

export interface ProductSubscriptionOption {
    SignupFee: number;
    Fee: number;
    Frequency: RecurringPaymentFrequency;
    TrialDayCount: number;
    CustomPeriodCount: number;
    CustomPeriodType: CustomPeriodType;
    GracePeriodDayCount: number;
>>>>>>> f999b481882149d107812286d0979872df712626
}
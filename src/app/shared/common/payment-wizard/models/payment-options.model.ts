import { PaymentPeriodType } from '@shared/service-proxies/service-proxies';

export interface PaymentOptions {
    productId: number;
    productName: string;
    currencyId: string;
    currencySymbol: string;
    paymentPeriodType: PaymentPeriodType;
    customPeriodDescription: string;
    total: number;
    signUpFee: number;
    trialDayCount: number;
}

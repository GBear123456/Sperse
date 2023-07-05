import { PaymentPeriodType } from '@shared/service-proxies/service-proxies';

export interface PaymentOptions {
    productId: number;
    productName: string;
    paymentPeriodType: PaymentPeriodType;
    customPeriodDescription: string;
    total: number;
}

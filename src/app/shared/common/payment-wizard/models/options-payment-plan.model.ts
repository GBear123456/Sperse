import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';

export interface OptionsPaymentPlan {
    name: string;
    billingPeriod: BillingPeriod;
    currencySymbol?: string;
    pricePerUserPerMonth: number;
    subtotal: number;
    discount?: number;
    usersAmount: number;
    total: number;
    selectedEditionId: number;
}

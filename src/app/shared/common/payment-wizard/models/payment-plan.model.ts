import { Feature } from '@app/shared/common/payment-wizard/models/feature.model';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';

export interface PaymentPlanModel {
    name: string;
    billingPeriod: BillingPeriod;
    monthlyBillingPrice: number;
    yearlyBillingPricePerMonth: number;
    features: Feature[];
    maxUsersAmount: number;
    usersAmount: number;
    isBestValue?: boolean;
}

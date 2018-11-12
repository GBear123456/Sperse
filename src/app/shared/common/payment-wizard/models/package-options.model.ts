import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { ModuleSubscriptionInfoFrequency } from '@shared/service-proxies/service-proxies';

export interface PackageOptions {
    name: string;
    billingPeriod: BillingPeriod;
    subscriptionFrequency: ModuleSubscriptionInfoFrequency;
    currencySymbol?: string;
    pricePerUserPerMonth: number;
    subtotal: number;
    discount?: number;
    usersAmount: number;
    total: number;
    selectedEditionId: number;
    selectedEditionName: string;
}

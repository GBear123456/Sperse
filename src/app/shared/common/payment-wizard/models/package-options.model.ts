import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { SetupSubscriptionInfoDtoFrequency } from '@shared/service-proxies/service-proxies';

export interface PackageOptions {
    name: string;
    billingPeriod: BillingPeriod;
    subscriptionFrequency: SetupSubscriptionInfoDtoFrequency;
    currencySymbol?: string;
    pricePerUserPerMonth: number;
    subtotal: number;
    discount?: number;
    usersAmount: number;
    total: number;
    selectedEditionId: number;
    selectedEditionName: string;
}

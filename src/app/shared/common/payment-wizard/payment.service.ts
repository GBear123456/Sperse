/** Application imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';
import { publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import {
    PaymentPeriodType,
    ProductInfo,
    ProductServiceProxy,
    RecurringPaymentFrequency
} from '@shared/service-proxies/service-proxies';
import { BillingPeriod } from './models/billing-period.enum';

@Injectable()
export class PaymentService {
    _plan: Subject<PaymentOptions> = new Subject();
    plan$: Observable<PaymentOptions> = this._plan.asObservable();
    packagesConfig$: Observable<ProductInfo[]> = this.productServiceProxy.getSubscriptionProductsByGroupName(
        AppConsts.PRODUCT_GROUP_MAIN
    ).pipe(
        publishReplay(),
        refCount()
    );

    constructor(
        private productServiceProxy: ProductServiceProxy
    ) { }

    getUpgradeConfig(productId: number): Observable<ProductInfo[]> {
        return this.productServiceProxy.getUpgradeProductsForProduct(productId).pipe(
            publishReplay(),
            refCount()
        );
    }

    static getBillingPeriod(paymentPeriodType: PaymentPeriodType): BillingPeriod {
        switch (paymentPeriodType) {
            case PaymentPeriodType.Monthly:
                return BillingPeriod.Monthly;
            case PaymentPeriodType.Annual:
                return BillingPeriod.Yearly;
            case PaymentPeriodType.LifeTime:
                return BillingPeriod.LifeTime;
            default:
                return undefined;
        }
    }

    static getRecurringPaymentFrequency(billingType: BillingPeriod): RecurringPaymentFrequency {
        switch (billingType) {
            case BillingPeriod.Monthly:
                return RecurringPaymentFrequency.Monthly;
            case BillingPeriod.Yearly:
                return RecurringPaymentFrequency.Annual;
            case BillingPeriod.LifeTime:
                return RecurringPaymentFrequency.LifeTime;
            default:
                return undefined;
        }
    }
}
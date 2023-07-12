/** Application imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, Subject, of } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';
import { publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { environment } from '@root/environments/environment';
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
    packagesConfig$: Observable<ProductInfo[]> = this.getPackagesConfig(
        AppConsts.PRODUCT_GROUP_MAIN
    );
    addOnConfig$: Observable<ProductInfo[]> = of([]);

    constructor(
        private productServiceProxy: ProductServiceProxy
    ) {
        /* Remove condition to enabled Add On Products for all environments */
        if (['staging', 'development'].includes(environment.releaseStage))
            this.addOnConfig$ = this.getPackagesConfig(
                AppConsts.PRODUCT_GROUP_ADD_ON
            );
    }

    getUpgradeConfig(productId: number): Observable<ProductInfo[]> {
        return this.productServiceProxy.getUpgradeProductsForProduct(productId).pipe(
            publishReplay(),
            refCount()
        );
    }

    getPackagesConfig(group: string): Observable<ProductInfo[]> {
        return this.productServiceProxy.getSubscriptionProductsByGroupName(
            group
        ).pipe(
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

    static getPaymentPeriodType(billingType: BillingPeriod): PaymentPeriodType {
        switch (billingType) {
            case BillingPeriod.Monthly:
                return PaymentPeriodType.Monthly;
            case BillingPeriod.Yearly:
                return PaymentPeriodType.Annual;
            case BillingPeriod.LifeTime:
                return PaymentPeriodType.LifeTime;
            case BillingPeriod.Custom:
                return PaymentPeriodType.Custom;
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
            case BillingPeriod.Custom:
                return RecurringPaymentFrequency.Custom;
            default:
                return undefined;
        }
    }
}
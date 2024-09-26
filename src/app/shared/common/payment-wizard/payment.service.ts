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
    ProductMeasurementUnit,
    ProductServiceProxy,
    RecurringPaymentFrequency,
    TenantSubscriptionServiceProxy
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
        private productServiceProxy: ProductServiceProxy,
        private tenantSubscriptionProxy: TenantSubscriptionServiceProxy
    ) {
        /* Remove condition to enabled Add On Products for all environments */
        if (['staging', 'development'].includes(environment.releaseStage))
            this.addOnConfig$ = this.getPackagesConfig(
                AppConsts.PRODUCT_GROUP_ADD_ON
            );
    }

    getUpgradeConfig(productId: number): Observable<ProductInfo[]> {
        return this.productServiceProxy.getHostUpgradeProductsForProduct(productId).pipe(
            publishReplay(),
            refCount()
        );
    }

    getPackagesConfig(group: string): Observable<ProductInfo[]> {
        return this.productServiceProxy.getSubscriptionProductsByGroupName(
            group, true, true
        ).pipe(
            publishReplay(),
            refCount()
        );
    }

    getProductInfo(productId: number): Observable<ProductInfo> {
        return this.tenantSubscriptionProxy.getHostProductInfo(
            productId
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

    static getBillingPeriodByPaymentFrequency(frequency: RecurringPaymentFrequency): BillingPeriod {
        switch (frequency) {
            case RecurringPaymentFrequency.Monthly:
                return BillingPeriod.Monthly;
            case RecurringPaymentFrequency.Annual:
                return BillingPeriod.Yearly;
            case RecurringPaymentFrequency.LifeTime:
                return BillingPeriod.LifeTime;
            case RecurringPaymentFrequency.OneTime:
                return BillingPeriod.OneTime;
            case RecurringPaymentFrequency.Custom:
                return BillingPeriod.Custom;
            default:
                return undefined;
        }
    }

    static getProductMeasurementUnit(frequency: RecurringPaymentFrequency): ProductMeasurementUnit {
        switch (frequency) {
            case RecurringPaymentFrequency.Monthly:
                return ProductMeasurementUnit.Month;
            case RecurringPaymentFrequency.Annual:
                return ProductMeasurementUnit.Year;
            case RecurringPaymentFrequency.LifeTime:
                return ProductMeasurementUnit.Piece;
            case RecurringPaymentFrequency.OneTime:
                return ProductMeasurementUnit.OneTime;
            case RecurringPaymentFrequency.Custom:
                return ProductMeasurementUnit.Custom;
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
            case BillingPeriod.OneTime:
                return PaymentPeriodType.OneTime;
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
            case BillingPeriod.OneTime:
                return RecurringPaymentFrequency.OneTime;
            case BillingPeriod.Custom:
                return RecurringPaymentFrequency.Custom;
            default:
                return undefined;
        }
    }
}
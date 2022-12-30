/** Application imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { AppConsts } from '@shared/AppConsts';
import { publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import {
    ProductInfo,
    ProductServiceProxy
} from '@shared/service-proxies/service-proxies';

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
    ) {}
}
/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

/** Application imports */
import {
    PaymentMethodInfo,
    GetPaymentsDto,
    TenantSubscriptionServiceProxy
} from 'shared/service-proxies/service-proxies';
import { PaymentsInfoService } from '../../payments-info/payments-info.service';

@Injectable()
export class PaymentWizardPaymentsInfoService extends PaymentsInfoService {
    obs$ = this.tenantSubsService.getTenantPayments()
        .pipe(
            publishReplay(),
            refCount()
        );

    constructor(
        private tenantSubsService: TenantSubscriptionServiceProxy
    ) {
        super();
    }

    getPaymentsObserverable(): Observable<GetPaymentsDto> {
        return this.obs$
            .pipe(
                map(x => x.paymentsInfo)
            );
    }

    getPaymentMethodsObserverable(): Observable<PaymentMethodInfo[]> {
        return this.obs$
            .pipe(
                map(x => x.paymentMethods)
            );
    }
}
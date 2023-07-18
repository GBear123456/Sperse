/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import {
    PaymentMethodInfo,
    GetPaymentsDto
} from 'shared/service-proxies/service-proxies';

@Injectable()
export abstract class PaymentsInfoService {
    constructor(
    ) {
    }

    abstract getPaymentsObserverable(): Observable<GetPaymentsDto>;

    abstract getPaymentMethodsObserverable(): Observable<PaymentMethodInfo[]>;
}
import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { PaymentOptions } from '@app/shared/common/payment-wizard/models/payment-options.model';
import { Observable } from '@node_modules/rxjs';

@Injectable()
export class PaymentService {
    _plan: Subject<PaymentOptions> = new Subject();
    plan$: Observable<PaymentOptions> = this._plan.asObservable();
    constructor() {}
}

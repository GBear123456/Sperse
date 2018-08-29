import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { OptionsPaymentPlan } from '@app/shared/common/payment-wizard/models/options-payment-plan.model';
import { Observable } from '@node_modules/rxjs';

@Injectable()
export class PaymentService {
    _plan: Subject<OptionsPaymentPlan> = new Subject();
    plan$: Observable<OptionsPaymentPlan> = this._plan.asObservable();
    constructor() { }
}

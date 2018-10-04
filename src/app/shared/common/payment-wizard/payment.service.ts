import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { PackageOptions } from '@app/shared/common/payment-wizard/models/package-options.model';
import { Observable } from '@node_modules/rxjs';

@Injectable()
export class PaymentService {
    _plan: Subject<PackageOptions> = new Subject();
    plan$: Observable<PackageOptions> = this._plan.asObservable();
    constructor() {}
}

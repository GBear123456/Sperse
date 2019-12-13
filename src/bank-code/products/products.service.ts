/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { MemberSubscriptionServiceProxy, GetUserSubscriptionsOutput } from '@shared/service-proxies/service-proxies';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Injectable()
export class ProductsService {

    private readonly systemType = 'BankCode';
    public subscriptions$: Observable<GetUserSubscriptionsOutput[]> = this.subscriptionProxy.getUserSubscriptions(this.systemType, undefined, undefined).pipe(
        publishReplay(),
        refCount()
    );

    constructor(
        private subscriptionProxy: MemberSubscriptionServiceProxy
    ) {}

    checkServiceSubscription(serviceTypeId: BankCodeServiceType): Observable<boolean> {
        return this.subscriptions$.pipe(
            map((subscriptions: GetUserSubscriptionsOutput[]) => {
                return subscriptions.some((sub: GetUserSubscriptionsOutput) => {
                    return sub.serviceTypeId == serviceTypeId && sub.endDate.diff(moment()) > 0;
                });
            })
        );
    }
}
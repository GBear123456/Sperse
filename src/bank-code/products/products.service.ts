/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import {
    MemberSubscriptionServiceProxy,
    GetUserSubscriptionsOutput
} from '@shared/service-proxies/service-proxies';

@Injectable()
export class ProductsService {

    private readonly systemType = 'BankCode';
    public subscriptions: GetUserSubscriptionsOutput[];

    constructor(
        private subscriptionProxy: MemberSubscriptionServiceProxy
    ) {   }

    loadSubscriptions(): Observable<GetUserSubscriptionsOutput[]> {
        return this.subscriptionProxy.getUserSubscriptions(this.systemType, undefined, undefined)
            .pipe(map((subscriptions: GetUserSubscriptionsOutput[]) => {
                return this.subscriptions = subscriptions;
            })
        );
    }

    checkServiceSubscription(serviceName: string = 'BankPass'): boolean {
        return (this.subscriptions || []).some((sub: GetUserSubscriptionsOutput) => {
            return sub.serviceName == serviceName && sub.endDate.diff(moment()) > 0;
        });
    }
}
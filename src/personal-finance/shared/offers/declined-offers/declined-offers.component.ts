import { Component } from '@angular/core';
import { OfferDto, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { Observable, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

@Component({
    selector: 'declined-offers',
    templateUrl: 'declined-offers.component.html',
    styleUrls: [ './declined-offers.component.less' ]
})

export class DeclinedOffersComponent {
    offersAreLoading = false;
    declinedOffers$: Observable<OfferDto[]> = of(this.offersAreLoading = true).pipe(
        switchMap(() => this.offersServiceProxy.getPostDeclineOffers()),
        finalize(() => this.offersAreLoading = false)
    );
    constructor(
        private offersServiceProxy: OfferServiceProxy
    ) {}
}

import { Component } from '@angular/core';
import { OfferDto, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { Observable } from '@node_modules/rxjs';

@Component({
    selector: 'declined-offers',
    templateUrl: 'declined-offers.component.html',
    styleUrls: [ './declined-offers.component.less' ]
})

export class DeclinedOffersComponent {
    declinedOffers$: Observable<OfferDto[]> = this.offersServiceProxy.getPostDeclineOffers();
    constructor(private offersServiceProxy: OfferServiceProxy) {}
}

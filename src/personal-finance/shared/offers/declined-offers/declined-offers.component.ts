/** Core imports */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

/** Application imports */
import { OfferDto, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Component({
    selector: 'declined-offers',
    templateUrl: 'declined-offers.component.html',
    styleUrls: [ './declined-offers.component.less' ]
})
export class DeclinedOffersComponent implements OnInit {
    offersAreLoading = false;
    declinedOffers$: Observable<OfferDto[]> = of(this.offersAreLoading = true).pipe(
        switchMap(() => this.offersServiceProxy.getPostDeclineOffers()),
        finalize(() => this.offersAreLoading = false)
    );
    constructor(
        private offersServiceProxy: OfferServiceProxy,
        private router: Router,
        private appHttpConfiguration: AppHttpConfiguration
    ) {}

    ngOnInit() {
        this.appHttpConfiguration.avoidErrorHandling = true;
        this.declinedOffers$.subscribe(
            (declinedOffers: OfferDto[]) => {
                this.appHttpConfiguration.avoidErrorHandling = false;
                if (!declinedOffers || !declinedOffers.length) {
                    this.navigateToPersonalLoans();
                }
            },
            () => {
                this.appHttpConfiguration.avoidErrorHandling = false;
                this.navigateToPersonalLoans();
            }
        );
    }

    private navigateToPersonalLoans() {
        this.router.navigateByUrl('/personal-finance/offers/personal-loans');
    }
}

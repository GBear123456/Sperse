/** Core imports */
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { OfferDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MarcusDetailsComponent } from '@root/personal-finance/shared/offers/marcus-details/marcus-details.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@Component({
    selector: 'offers-list',
    templateUrl: 'offers-list.component.html',
    styleUrls: [ './offers-list.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersListComponent implements OnChanges {
    @Input() offers: OfferDto[];
    @Input() areCreditCards = false;
    @Input() headerTitle: string;
    @Input() buttonCaption = 'Apply';
    @Input() creditScore: number;
    @Input() offersAreLoading = false;
    @Input() showDetailsButton = true;
    @Input() simpleDesign = false;
    readonly defaultVisibleOffersCount = 6;
    visibleOffersCount = this.defaultVisibleOffersCount;
    offersCount: number;
    constructor(
        private sessionService: AppSessionService,
        private router: Router,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        public offersService: OffersService,
        public ls: AppLocalizationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.offers && !changes.offers.firstChange) {
            this.offersCount = changes.offers.currentValue && changes.offers.currentValue.length;
        }
    }

    showNextItems() {
        this.visibleOffersCount += this.defaultVisibleOffersCount;
    }

    checkDemoUserActionAllowed(card: OfferDto, redirect = false) {
        if (this.sessionService.isLendspaceDemoUser && this.creditScore) {
            let result = this.creditScore < 720;
            if (!result && card && card.redirectUrl)
                redirect ? window.open(card.redirectUrl) :
                    this.dialog.open(MarcusDetailsComponent, {
                        width: '900px',
                        height: '350px'
                    });

            return result;
        } else
            return true;
    }

    viewCardDetails(card: OfferDto) {
        if (this.checkDemoUserActionAllowed(card))
            return this.router.navigate(['./', card.campaignId], { relativeTo: this.route });
    }

    applyOffer(offer: OfferDto) {
        if (this.checkDemoUserActionAllowed(offer, true))
            this.offersService.applyOffer(offer, this.areCreditCards);
    }
}

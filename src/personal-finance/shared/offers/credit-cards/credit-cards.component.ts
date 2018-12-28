import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, map } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import * as _ from 'underscore';

import { CampaignDto, Category, ItemOfOfferCollection, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@Component({
    selector: 'pfm-credit-cards-home',
    templateUrl: './credit-cards.component.html',
    styleUrls: ['./credit-cards.component.less']
})
export class CreditCardsComponent implements OnInit {
    cardOffersList$: Observable<CampaignDto[]>;
    creditScoreNames = ['Excellent', 'Good', 'Fair', 'Bad', 'NoCredit'];
    creditCardCollection: any[] = [];
    filteredGroup: any[] = [];
    bestCardsByScore: any[] = [];
    bestCreditCard: any;
    cards: CampaignDto[];
    selectedOfferGroup: CampaignDto;

    offerCollection$: Observable<any> = combineLatest(
        this.route.params,
        this.route.queryParams
    ).pipe(
        map(([params, queryParams]) => ({...params, ...queryParams}))
    );

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private offerServiceProxy: OfferServiceProxy,
        private offersService: OffersService,
        public ls: AppLocalizationService
    ) {
        abp.ui.setBusy();
        this.cardOffersList$ = this.offerServiceProxy.getAll(
            Category.CreditCards,
            undefined,
            'US',
            undefined,
            true,
            undefined
            )
            .pipe(finalize(() => abp.ui.clearBusy()));

        this.cardOffersList$.subscribe(list => {
            this.bestCreditCard = _.first(list.filter(item => 'Best' == item.offerCollection));
            this.selectedOfferGroup = _.first(list.filter(item => this.route.snapshot.params.group == item.offerCollection));
            this.creditCardCollection = list.filter(item => !_.contains(this.creditScoreNames, item.offerCollection));
            this.bestCardsByScore = list.filter(item => _.contains(this.creditScoreNames, item.offerCollection));
            this.filteredGroup = _.uniq(this.creditCardCollection, 'offerCollection');
        });
    }

    ngOnInit() {
        this.offerCollection$.subscribe(collectionName => {
            this.getCreditCards(collectionName.group);
            this.selectedOfferGroup = this.creditCardCollection.filter(item => item.offerCollection == collectionName.group)[0];
        });
    }

    openOffers(offer: CampaignDto) {
        this.offersService.applyOffer(offer);
    }

    getCreditCards(collection = 'Best') {
        abp.ui.setBusy();
        this.offerServiceProxy.getAll(
            Category.CreditCards,
            undefined,
            'US',
            undefined,
            true,
            ItemOfOfferCollection[collection]
            )
            .pipe(finalize(() => abp.ui.clearBusy()))
            .subscribe( (offers: CampaignDto[]) => {
                this.cards = offers;
            });
    }
}

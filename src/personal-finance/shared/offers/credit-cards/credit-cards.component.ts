import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    Inject,
    ViewChild,
    Renderer2
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, map, switchMap } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import * as _ from 'underscore';

import { OfferDto, Category, ItemOfOfferCollection, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'pfm-credit-cards-home',
    templateUrl: './credit-cards.component.html',
    styleUrls: ['./credit-cards.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class CreditCardsComponent implements OnInit, OnDestroy {
    private _resultByCategory: ElementRef;
    @ViewChild('resultByCategory') set resultByCategory (resultByCategory: ElementRef) {
        this._resultByCategory = resultByCategory;
    }
    cardOffersList$: Observable<OfferDto[]>;
    creditScoreNames = ['Excellent', 'Good', 'Fair', 'Bad', 'NoCredit'];
    creditCardCollection: OfferDto[] = [];
    filteredGroup: OfferDto[] = [];
    bestCardsByScore: OfferDto[] = [];
    bestCreditCard: any;
    cards: OfferDto[];
    selectedOfferGroup: OfferDto;

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
        public ls: AppLocalizationService,
        private lifecycleSubjectService: LifecycleSubjectsService,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: any
    ) {
        abp.ui.setBusy();
        this.cardOffersList$ =
            this.offersService.memberInfo$.pipe(
                switchMap((memberInfo) =>
                    this.offerServiceProxy.getAll(
                        memberInfo.testMode,
                        memberInfo.isDirectPostSupported,
                        Category.CreditCards,
                        undefined,
                        'US',
                        undefined,
                        true,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined
                    )),
                finalize(() => abp.ui.clearBusy())
            );

        this.cardOffersList$.subscribe(list => {
            const itemOfOfferCollections = _.values(ItemOfOfferCollection);
            this.bestCreditCard = _.first(list.filter(item => 'Best' == item.offerCollection));
            this.selectedOfferGroup = _.first(list.filter(item => this.route.snapshot.params.group == item.offerCollection));
            this.creditCardCollection = list.filter(item => !_.contains(this.creditScoreNames, item.offerCollection));
            this.bestCardsByScore = list.filter(item => _.contains(this.creditScoreNames, item.offerCollection)).sort(this.sortCollection.bind(this, itemOfOfferCollections));
            this.filteredGroup = _.uniq(this.creditCardCollection, 'offerCollection').sort(this.sortCollection.bind(this, itemOfOfferCollections));
        });
    }

    sortCollection(itemOfOfferCollections, a, b) {
        return itemOfOfferCollections.indexOf(a['offerCollection']) > itemOfOfferCollections.indexOf(b['offerCollection']) ? 1 : -1;
    }

    ngOnInit() {
        this.offerCollection$.subscribe(collectionName => {
            this.getCreditCards(collectionName.group);
            this.selectedOfferGroup = this.creditCardCollection.filter(item => item.offerCollection == collectionName.group)[0];
            if (this._resultByCategory) {
                this.document.body.scrollBy(0, this._resultByCategory.nativeElement.getBoundingClientRect().top - 100);
            }
        });
    }

    openOffers(offer: OfferDto) {
        this.offersService.applyOffer(offer, true);
    }

    getCreditCards(collection = 'Best') {
        abp.ui.setBusy();

        this.offersService.memberInfo$.pipe(
            switchMap(memberInfo => this.offerServiceProxy.getAll(
                memberInfo.testMode,
                memberInfo.isDirectPostSupported,
                Category.CreditCards,
                undefined,
                'US',
                undefined,
                false,
                ItemOfOfferCollection[collection],
                undefined,
                undefined,
                undefined,
                undefined
            )),
            finalize(() => abp.ui.clearBusy())
        ).subscribe((offers: OfferDto[]) => {
            this.cards = offers;
        });
    }

    ngOnDestroy() {
        this.lifecycleSubjectService.destroy.next();
    }
}

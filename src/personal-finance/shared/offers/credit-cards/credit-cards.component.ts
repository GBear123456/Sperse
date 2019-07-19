/** Application imports */
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
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

/** Third party imports */
import { Observable, combineLatest } from 'rxjs';
import { delay, finalize, map, switchMap, takeUntil, tap, skip, publishReplay, refCount, filter } from 'rxjs/operators';
import * as _ from 'underscore';

/** Core imports */
import {
    OfferDto,
    OfferServiceProxy,
    OfferCollection,
    GetMemberInfoResponse,
    CampaignCategory,
    GetAllInput,
    SortOrderType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { CustomItemOfOfferCollection } from '@root/personal-finance/shared/offers/credit-cards/custom-item-of-offer-collection.enum';

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
    skipScrollFirstTime: Boolean;

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
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            let collection = event.url.split('/').pop();
            this.skipScrollFirstTime = (collection == 'home') || !OfferCollection[collection] && (collection != 'NewestOffers');
        });
    }

    sortCollection(itemOfOfferCollections, a, b) {
        return itemOfOfferCollections.indexOf(a['offerCollection']) > itemOfOfferCollections.indexOf(b['offerCollection']) ? 1 : -1;
    }

    ngOnInit() {
        this.cardOffersList$ = this.getCreditCards().pipe(publishReplay(), refCount());
        this.cardOffersList$.subscribe(list => {
            const itemOfOfferCollections = _.values(OfferCollection);
            this.bestCreditCard = list.find(item => item.offerCollection === OfferCollection.Best);
            this.selectedOfferGroup = list.find(item => this.route.snapshot.params.group == item.offerCollection);
            this.creditCardCollection = list.filter(item => !_.contains(this.creditScoreNames, item.offerCollection));
            this.bestCardsByScore = list.filter(item => _.contains(this.creditScoreNames, item.offerCollection)).sort(this.sortCollection.bind(this, itemOfOfferCollections));
            this.filteredGroup = _.uniq(this.creditCardCollection, 'offerCollection').sort(this.sortCollection.bind(this, itemOfOfferCollections));
            /** @todo fix in new version with the getting the whole categories from backend */
            this.filteredGroup.unshift(
                OfferDto.fromJS({
                    name: 'Special Deals',
                    offerCollection: CustomItemOfOfferCollection.SpecialDeals
                }),
                OfferDto.fromJS({
                    name: 'Newest Offers',
                    offerCollection: CustomItemOfOfferCollection.Newest
                })
            );
        });

        const creditCards$ = this.offerCollection$.pipe(
            takeUntil(this.lifecycleSubjectService.destroy$),
            tap(collectionName => this.selectedOfferGroup = this.creditCardCollection.filter(item => item.offerCollection == collectionName.group)[0]),
            switchMap(collectionName => this.getCreditCards(collectionName.group, false)),
            publishReplay(),
            refCount()
        );

        creditCards$.subscribe((offers: OfferDto[]) => this.cards = offers);
        creditCards$.pipe(skip(Number(this.skipScrollFirstTime)), delay(25)).subscribe(() => this.scrollToTopCards());
    }

    scrollToTopCards() {
        this.document.body.scrollBy(0, this._resultByCategory.nativeElement.getBoundingClientRect().top - 100);
    }

    openOffers(offer: OfferDto) {
        this.offersService.applyOffer(offer, true);
    }

    getCreditCards(collection?: OfferCollection | CustomItemOfOfferCollection, isOfferCollection = true): Observable<OfferDto[]> {
        abp.ui.setBusy();
        return this.offersService.memberInfo$.pipe(
            switchMap((memberInfo: GetMemberInfoResponse) => this.offerServiceProxy.getAll(GetAllInput.fromJS({
                testMode: memberInfo.testMode,
                isDirectPostSupported: memberInfo.isDirectPostSupported,
                category: CampaignCategory.CreditCards,
                country: 'US',
                isOfferCollection: isOfferCollection,
                itemOfOfferCollection: CustomItemOfOfferCollection[collection] || OfferCollection[collection],
                sortOrderType: collection === CustomItemOfOfferCollection.Newest ? SortOrderType.Newest : SortOrderType.Best,
                topCount: collection === CustomItemOfOfferCollection.Newest ? 30 : undefined
            }))),
            finalize(() => abp.ui.clearBusy())
        );
    }

    ngOnDestroy() {
        this.lifecycleSubjectService.destroy.next();
    }
}

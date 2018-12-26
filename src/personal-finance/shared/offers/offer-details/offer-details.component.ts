/** Core imports */
import {
    ApplicationRef,
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    OnInit,
    OnDestroy,
    ViewChild,
    Injector,
    Renderer2
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatRadioChange } from '@angular/material/radio';
import { Observable, Subject, ReplaySubject, of } from 'rxjs';
import { finalize, first, map, switchMap, takeUntil, pluck, tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    Category,
    OfferServiceProxy,
    CampaignDto,
    CampaignDetailsDto,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    CreditScores2
} from '@shared/service-proxies/service-proxies';
import { CreditScoreInterface } from '@root/personal-finance/shared/offers/interfaces/credit-score.interface';

@Component({
    templateUrl: 'offer-details.component.html',
    styleUrls: [ './offer-details.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('availableCards') availableCardsRef: ElementRef;
    @ViewChild('creditCardsList') creditCardsListRef: ElementRef;
    @ViewChild('detailsContainer') detailsContainerRef: ElementRef;
    @ViewChild('offersList') offersListRef: ElementRef;
    creditCards$: Observable<CampaignDto[]>;
    cardsAmount: number;
    selectedCardId: ReplaySubject<number> = new ReplaySubject<number>(1);
    selectedCardId$: Observable<number> = this.selectedCardId.asObservable();
    selectedCardDetails$: Observable<CampaignDetailsDto>;
    category$: Observable<Category>;
    selectedCategory: string;
    categoryDisplayName$: Observable<string>;
    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();
    buttonCaption: string = 'Apply';

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        public offersService: OffersService,
        private offerServiceProxy: OfferServiceProxy,
        private renderer: Renderer2
    ) {
    }

    ngOnInit() {
        this.activate();
    }

    activate() {
        this.category$ = this.offersService.getCategoryFromRoute(this.route.params).pipe(first());
        this.category$.subscribe(res => { 
            switch(this.selectedCategory = res) {
                case Category.PersonalLoans: 
                    this.buttonCaption = 'ApplyNow';
                    break;
                case Category.CreditCards: 
                    this.buttonCaption = 'ViewOffers';
                    break;
                case Category.CreditScore: 
                    this.buttonCaption = 'GetOffer';
                    break;
            } 
        });
        this.categoryDisplayName$ = this.category$.pipe(map(category => this.offersService.getCategoryDisplayName(category)));
        this.route.params.pipe(
            takeUntil(this.deactivate$),
            pluck('id'),
        ).subscribe(id => this.selectedCardId.next(+id));
        this.creditCards$ = this.getCreditCards();
        this.creditCards$.pipe(takeUntil(this.deactivate$)).subscribe(creditCards => this.cardsAmount = creditCards.length);
        this.selectedCardDetails$ = this.selectedCardId$.pipe(
            takeUntil(this.deactivate$),
            switchMap((cardId: number) => this.getCardDetails(cardId))
        );
    }

    private getCardDetails(cardId: number): any {
        abp.ui.setBusy(this.detailsContainerRef.nativeElement);
        return this.category$
            .pipe(
                switchMap((category) => this.offerServiceProxy.getDetails(cardId, category)),
                /** @todo remove in future */
                map(details => {
                    return {
                        ...details,
                        ...{
                            apr: '17.49%',
                            penaltyApr: '19.20%',
                            advancedApr: '23.49%',
                            pros: [
                                'High rewards rates',
                                'No foreign transaction fee'
                            ],
                            cons: [
                                'Has annual fees'
                            ],
                            rewardsRate: '16%',
                            annualFee: '$0 first year, $59 after',
                            introApr: 'N/A'
                        }
                    };
                }),
                tap(() => abp.ui.clearBusy(this.detailsContainerRef.nativeElement))
            );
    }

    private getCreditCards() {
        abp.ui.setBusy(this.creditCardsListRef.nativeElement);
        return (this.offersService.displayedCards && this.offersService.displayedCards.length ?
                    of(this.offersService.displayedCards) :
                    this.category$.pipe(
                        switchMap(category => this.offerServiceProxy.getAll(category, undefined, 'US', undefined, category, undefined, undefined))
                    )
                ).pipe(
                    finalize(() => abp.ui.clearBusy(this.creditCardsListRef.nativeElement))
                );
    }

    creditCardChanged(e: MatRadioChange) {
        this.selectedCardId.next(e.value);
        /** Update url with new card id */
        const newUrl = this.router.createUrlTree(['../' + e.value], { relativeTo: this.route }).toString();
        this.location.replaceState(newUrl);
    }

    toggleOffersList() {
        this.offersListRef.nativeElement.classList.contains('sm-hidden')
            ? this.renderer.removeClass(this.offersListRef.nativeElement, 'sm-hidden')
            : this.renderer.addClass(this.offersListRef.nativeElement, 'sm-hidden');
    }

    applyOffer(offer: CampaignDto) {
        this.category$.pipe(first()).subscribe(category => {
            this.offersService.applyOffer(offer, category);
        });
    }

    getCreditScore(creditScores: CreditScores2[]): CreditScoreInterface {
        return creditScores && (creditScores.length > 1 || (creditScores.length === 1 && creditScores[0] !== CreditScores2.NotSure))
                  ? this.offersService.getCreditScoreObject(creditScores[0] as any)
                  : null;
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
    }
}

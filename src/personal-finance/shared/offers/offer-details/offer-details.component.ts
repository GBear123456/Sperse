/** Core imports */
import {
    ApplicationRef,
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnInit,
    OnDestroy,
    ViewChild,
    Injector
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { MatRadioChange } from '@angular/material/radio';
import { Observable, Subject, ReplaySubject, of } from 'rxjs';
import { finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootComponent } from '@root/root.components';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { Type, OfferServiceProxy, CampaignDto } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'offer-details.component.html',
    styleUrls: [ './offer-details.component.less' ]
})
export class OfferDetailsComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('availableCards') availableCardsRef: ElementRef;
    @ViewChild('creditCardsList') creditCardsListRef: ElementRef;
    @ViewChild('detailsContainer') detailsContainerRef: ElementRef;
    creditCards$: Observable<CampaignDto[]>;
    cardsAmount: number;
    scrollHeight: number;
    selectedCardId: ReplaySubject<number> = new ReplaySubject<number>();
    selectedCardId$: Observable<number> = this.selectedCardId.asObservable();
    selectedCardDetails$: Observable<any>;
    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();
    private rootComponent: RootComponent;

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private offersService: OffersService,
        private offerServiceProxy: OfferServiceProxy
    ) {
        this.rootComponent = injector.get(applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.activate();
    }

    activate() {
        this.route.params.pipe(
            takeUntil(this.deactivate$),
            map((params: any) => params.id)
        ).subscribe(id => this.selectedCardId.next(+id));
        this.creditCards$ = this.getCreditCards();
        this.creditCards$.subscribe(creditCards => this.cardsAmount = creditCards.length);
        this.selectedCardDetails$ = this.selectedCardId$.pipe(
            takeUntil(this.deactivate$),
            switchMap((cardId: number) => this.getCardDetails(cardId))
        );
    }

    ngAfterViewInit() {
        this.calcScrollHeight();
    }

    private getCardDetails(cardId: number) {
        abp.ui.setBusy(this.detailsContainerRef.nativeElement);
        return this.offerServiceProxy.getDetails(cardId).pipe(
            /** @todo remove in future */
            map(details => {
                return {
                    ...details,
                    ...{
                        details: [
                            'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.',
                            'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
                            'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus',
                            'Omnis voluptas assumenda est, omnis dolor repellendus.',
                            'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.'
                        ],
                        apr: '17.49%',
                        penaltyApr: '19.20%',
                        advancedApr: '23.49%',
                        pros: [
                            'High rewards rates',
                            'No foreign transaction fee'
                        ],
                        cons: [
                            'Has anual fees'
                        ],
                        recommendedCreditScore: {
                            min: 450,
                            max: 650,
                            name: 'Good'
                        },
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
            this.offerServiceProxy.getAll(undefined, Type.TrafficDistribution, 'US')).pipe(
            finalize(() => abp.ui.clearBusy(this.creditCardsListRef.nativeElement))
        );
    }

    @HostListener('window:resize', ['$event']) onResize() {
        this.calcScrollHeight();
    }

    calcScrollHeight() {
        const footerElement = this.rootComponent.hostElement.nativeElement.querySelector('.page-footer-inner');
        const footerHeight = footerElement ? footerElement.getBoundingClientRect().height + 30 : 90;
        this.scrollHeight = window.innerHeight - this.availableCardsRef.nativeElement.getBoundingClientRect().top - footerHeight;
    }

    creditCardChanged(e: MatRadioChange) {
        this.selectedCardId.next(e.value);
        /** Update url with new card id */
        const newUrl = this.router.createUrlTree(['../' + e.value], { relativeTo: this.route }).toString();
        this.location.replaceState(newUrl);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
    }
}

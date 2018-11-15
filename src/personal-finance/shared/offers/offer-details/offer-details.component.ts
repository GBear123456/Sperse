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
import { map, switchMap, takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditCard } from '@root/personal-finance/shared/offers/models/credit-card.interface';
import { CreditCardDetails } from '@root/personal-finance/shared/offers/models/credit-card-details.interface';
import { RootComponent } from '@root/root.components';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

@Component({
    templateUrl: 'offer-details.component.html',
    styleUrls: [ './offer-details.component.less' ]
})
export class OfferDetailsComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('availableCards') availableCardsRef: ElementRef;
    creditCards$: Observable<CreditCard[]>;
    cardsAmount: number;
    scrollHeight: number;
    selectedCardId: ReplaySubject<number> = new ReplaySubject<number>();
    selectedCardId$: Observable<number> = this.selectedCardId.asObservable();
    selectedCardDetails$: Observable<CreditCardDetails>;
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
        private offersService: OffersService
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
        ).subscribe(id => this.selectedCardId.next(id));

        this.selectedCardDetails$ = this.selectedCardId$.pipe(
            takeUntil(this.deactivate$),
            switchMap(cardId => this.offersService.getCreditCardDetails(cardId))
        );

        this.creditCards$ = this.offersService.displayedCards && this.offersService.displayedCards.length ?
            of(this.offersService.displayedCards) :
            this.offersService.getCreditCards();

        /** Set overflow hidden to container */
        this.rootComponent.overflowHidden(true);
    }

    ngAfterViewInit() {
        this.calcScrollHeight();
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

    applyCard(id: number) {
        console.log('apply card', id);
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
        this.rootComponent.overflowHidden(false);
    }
}

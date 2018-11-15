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
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CreditCard } from '@root/personal-finance/member-area/offers/models/credit-card.interface';
import { CreditCardDetails } from '@root/personal-finance/member-area/offers/models/credit-card-details.interface';
import { MatRadioChange } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, of, combineLatest } from 'rxjs';
import { filter, map, switchMap, tap, takeUntil } from 'rxjs/operators';
import { CreditCardsService } from '@root/personal-finance/member-area/offers/credit-cards.service';
import { RootComponent } from '@root/root.components';
import { BehaviorSubject, ReplaySubject } from '@node_modules/rxjs';

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

    private destroy: Subject<null> = new Subject<null>();
    private destroy$: Observable<null> = this.destroy.asObservable();
    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();

    private rootComponent: RootComponent;
    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private route: ActivatedRoute,
        private router: Router,
        private creditCardsService: CreditCardsService,
        private location: Location
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
            switchMap(cardId => this.creditCardsService.getCreditCardDetails(cardId))
        );

        this.creditCards$ = this.creditCardsService.displayedCards && this.creditCardsService.displayedCards.length ?
            of(this.creditCardsService.displayedCards) :
            this.creditCardsService.getCreditCards();

        /** Set overflow hidden to container */
        this.rootComponent.overflowHidden(true);
        console.log('offers details activate');
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
        this.destroy.next();
        this.destroy.unsubscribe();
    }

    deactivate() {
        this.deactivateSubject.next();
        this.rootComponent.overflowHidden(false);
    }
}

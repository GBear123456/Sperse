/** Core imports */
import {
    AfterViewInit,
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Injector,
    OnDestroy,
    ElementRef,
    ViewChild,
    HostListener,
    Renderer2
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { first, map, publishReplay, refCount, takeUntil } from 'rxjs/operators';
import { isEmpty, pickBy } from 'lodash';
import { MatSelect } from '@angular/material';

/** Third party improrts */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootComponent } from '@root/root.components';
import { CreditCard } from '@root/personal-finance/shared/offers/models/credit-card.interface';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';

interface FilterValues {
    [field: string]: { [filterValue: string]: string };
}

@Component({
    templateUrl: './offers.component.html',
    styleUrls: [ './offers.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OffersComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('creditCardsList') creditCardsListRef: ElementRef;
    @ViewChild('filtersSideBar') filtersSideBar: ElementRef;
    @ViewChild('sortingSelect') sortingSelect: MatSelect;
    private creditCards$: Observable<CreditCard[]>;
    displayedCreditCards$: Observable<CreditCard[]>;
    creditCardsAmount: number;
    sortings = [
        {
            name: this.ls.l('Offers_Sorting_UserRating'),
            field: 'rating'
        },
        {
            name: this.ls.l('Offers_Sorting_BankName'),
            field: 'bankName'
        },
        {
            name: this.ls.l('Offers_Sorting_RewardsBonus'),
            field: 'rewardsBonus'
        }
    ];
    filters = [
        {
            name: this.ls.l('Offers_Filter_Brand'),
            field: 'bankName',
            values: [],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Type'),
            field: 'type',
            values: [],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Category'),
            field: 'category',
            values: [],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Network'),
            field: 'network',
            values: [],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Rating'),
            field: 'rating',
            values: [],
            showAll: false,
            type: 'rating'
        }
    ];
    filtersValues: FilterValues = {};
    maxDisplayedFilterValues = 5;
    selectedFilter = new BehaviorSubject(this.filtersValues);
    private selectedFilter$ = this.selectedFilter.asObservable();

    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();

    selectedSorting: BehaviorSubject<string> = new BehaviorSubject(this.sortings[0].field);
    private selectedSorting$ = this.selectedSorting.asObservable();
    scrollHeight: number;
    private rootComponent: RootComponent;

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private router: Router,
        private offersService: OffersService,
        private renderer: Renderer2,
        private route: ActivatedRoute
    ) {
        this.rootComponent = injector.get(applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.creditCards$ = this.offersService.getCreditCards().pipe(publishReplay(), refCount());
        /** Insert filters values from credit cards data */
        this.creditCards$.pipe(first()).subscribe(creditCards => {
            this.fullFillFilterValues(creditCards);
            this.hideTooBigFilters();
        });
        this.creditCards$.pipe(first()).subscribe(creditCards => this.creditCardsAmount = creditCards.length);
        this.createFiltersObject();
        this.activate();
    }

    activate() {
        this.displayedCreditCards$ =
            combineLatest(
                this.creditCards$,
                this.selectedFilter$,
                this.selectedSorting$
            ).pipe(
                takeUntil(this.deactivate$),
                map(([creditCards, filtersValues, sortingField]) => this.sortCards(
                    this.filterCards(creditCards, filtersValues),
                    sortingField
                ))
            );
        this.displayedCreditCards$.pipe(takeUntil(this.deactivate$)).subscribe(displayedCreditCards => {
            this.offersService.displayedCards = displayedCreditCards;
        });

        /** Set overflow hidden to container */
        this.rootComponent.overflowHidden(true);
    }

    /**
     * Fullfill filters with credit cards values
     * @param {CreditCard[]} creditCards
     */
    private fullFillFilterValues(creditCards: CreditCard[]) {
        creditCards.forEach(creditCard => {
            this.filters.forEach(filter => {
                if (creditCard[filter.field] !== undefined && filter.values.indexOf(creditCard[filter.field]) === -1) {
                    filter.values.push(creditCard[filter.field]);
                }
            });
        });
    }

    private hideTooBigFilters() {
        /** Change whether to dispay all filter values */
        this.filters.forEach(filter => {
            if (filter.values.length <= this.maxDisplayedFilterValues) {
                filter.showAll = true;
            }
        });
    }

    private createFiltersObject() {
        this.filters.forEach(filter => this.filtersValues[filter.field] = {});
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
        this.scrollHeight = window.innerHeight - this.creditCardsListRef.nativeElement.getBoundingClientRect().top - footerHeight;
    }

    filterCards(creditCards: CreditCard[], filtersValues: FilterValues): CreditCard[] {
        return creditCards.filter( creditCard => {
            for (let field in filtersValues) {
                const cardFieldValue = creditCard[field];
                let selectedFilterValues = pickBy(filtersValues[field]);
                if (!isEmpty(selectedFilterValues) &&
                    (!selectedFilterValues.hasOwnProperty(cardFieldValue))
                ) {
                    return false;
                }
            }
            return true;
        });
    }

    sortCards(creditCards: CreditCard[], field: string): CreditCard[]  {
        return creditCards.sort((cardA, cardB) => {
            /** If values are numbers - sort in another order */
            return (cardA[field] > cardB[field] ? 1 : -1) * (!isNaN(cardA[field]) ? -1 : 1);
        });
    }

    applyCard(card: CreditCard) {
        console.log(card);
    }

    viewCardDetails(card: CreditCard) {
        this.router.navigate(['../offer', card.id], { relativeTo: this.route });
    }

    showFiltering(e) {
        this.filtersSideBar.nativeElement.classList.contains('xs-hidden')
            ? this.renderer.removeClass(this.filtersSideBar.nativeElement, 'xs-hidden')
            : this.renderer.addClass(this.filtersSideBar.nativeElement, 'xs-hidden');
    }

    showSorting(e) {
        this.sortingSelect.toggle();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
        this.rootComponent.overflowHidden(false);
    }
}

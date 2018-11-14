import {
    AfterViewInit,
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    OnInit,
    Injector,
    OnDestroy,
    ElementRef, ViewChild, HostListener
} from '@angular/core';

import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { isEmpty, pickBy } from 'lodash';

import { RootComponent } from '@root/root.components';

interface CreditCard {
    cardName: string;
    bankName: string;
    reviewsAmount: number;
    annualFee: string;
    rewardsRate: string;
    rewardsBonus: string;
    apr: string;
    rating: number;
    imageName: string;
    type: string;
    category: string;
    network: string;
}

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

    private destroy: Subject<null> = new Subject<null>();
    private destroy$: Observable<null> = this.destroy.asObservable();

    private selectedSorting: BehaviorSubject<string> = new BehaviorSubject(this.sortings[0].field);
    private selectedSorting$ = this.selectedSorting.asObservable();
    scrollHeight: number;
    private rootComponent: RootComponent;

    constructor(
        injector: Injector,
        public ls: AppLocalizationService,
        private applicationRef: ApplicationRef
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.creditCards$ = of([
            {
                bankName: 'Bank of America',
                cardName: 'BankAmercard',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'bankAmericard',
                type: 'Small business',
                category: 'Hotel points',
                network: 'AmEx'
            },
            {
                bankName: 'Capital One',
                cardName: 'Quicksilver One',
                reviewsAmount: 152,
                annualFee: '$45',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'quickSilver',
                type: 'Personal',
                category: 'Cashback',
                network: 'Diners Club'
            },
            {
                bankName: 'City Bank',
                cardName: 'Adbantage',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 4,
                imageName: 'advantage',
                type: 'Small business',
                category: 'Airline miles',
                network: 'Master'
            },
            {
                bankName: 'City Bank',
                cardName: 'Adbantage',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 4,
                imageName: 'advantage',
                type: 'Small business',
                category: 'Airline miles',
                network: 'AmEx'
            },
            {
                bankName: 'Capital One',
                cardName: 'Quicksilver One',
                reviewsAmount: 152,
                annualFee: '$45',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'quickSilver',
                type: 'Personal',
                category: 'Cashback',
                network: 'Visa'
            },
        ]);
        /** Insert filters values from credit cards data */
        this.creditCards$.pipe(takeUntil(this.destroy$)).subscribe(creditCards => {
            creditCards.forEach(creditCard => {
                this.filters.forEach(filter => {
                    if (creditCard[filter.field] !== undefined && filter.values.indexOf(creditCard[filter.field]) === -1) {
                        filter.values.push(creditCard[filter.field]);
                    }
                });
            });
            /** Change whether to dispay all filter values */
            this.filters.forEach(filter => {
                if (filter.values.length <= this.maxDisplayedFilterValues) {
                    filter.showAll = true;
                }
            });
        });
        this.creditCards$.pipe(takeUntil(this.destroy$)).subscribe(creditCards => this.creditCardsAmount = creditCards.length);
        this.displayedCreditCards$ =
            combineLatest(
                this.creditCards$,
                this.selectedFilter$,
                this.selectedSorting$
            ).pipe(
                takeUntil(this.destroy$),
                map(([creditCards, filtersValues, sortingField]) => this.sortCards(
                    this.filterCards(creditCards, filtersValues),
                    sortingField
                ))
            );

        this.filters.forEach(filter => {
            this.filtersValues[filter.field] = {};
        });
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
        console.log(card);
    }

    ngOnDestroy() {
        this.destroy.next();
        this.rootComponent.overflowHidden(false);
    }
}

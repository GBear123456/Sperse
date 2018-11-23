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
    Renderer2,
    ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { first, finalize, map, publishReplay, refCount, takeUntil, tap, pluck, switchMap } from 'rxjs/operators';
import { camelCase, isEmpty, pickBy, lowerCase, upperFirst } from 'lodash';
import { MatSelect } from '@angular/material';

/** Third party improrts */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootComponent } from '@root/root.components';
import { CreditCard } from '@root/personal-finance/shared/offers/models/credit-card.interface';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    CampaignDto,
    Category,
    Type,
    OfferServiceProxy,
    SubmitApplicationInput,
    SubmitApplicationOutput
} from '@shared/service-proxies/service-proxies';

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
    private creditCards$: Observable<any>;
    displayedCreditCards$: Observable<any>;
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
            values: [ 'American Express', 'Bank of America', 'Barclaycard', 'Capital One', 'Chase' ],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Type'),
            field: 'type',
            values: [ 'Small business', 'Personal' ],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Category'),
            field: 'category',
            values: [ 'Best current offers', 'Flexible points', 'Hotel points', 'Airline miles', 'Cashback' ],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Network'),
            field: 'network',
            values: [ 'AmEx', 'Visa', 'Master', 'Diners Club', 'Cashback' ],
            showAll: false
        },
        {
            name: this.ls.l('Offers_Filter_Rating'),
            field: 'rating',
            values: [ 5, 4, 3, 2, 1 ],
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
    creditCardloaded = false;
    category$: Observable<string>;
    categoryDisplayName$: Observable<string>;
    defaultCategoryDisplayName: string = this.ls.l('Offers_CreditCards');

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private router: Router,
        private offersService: OffersService,
        private renderer: Renderer2,
        private route: ActivatedRoute,
        private offerServiceProxy: OfferServiceProxy,
        private changeDetectorRef: ChangeDetectorRef
    ) {
        this.rootComponent = injector.get(applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.activate();
    }

    activate() {
        this.category$ = this.route.params.pipe(
            pluck('category'),
            map((category: string) => Category[upperFirst(camelCase(category))])
        );
        this.categoryDisplayName$ = this.category$.pipe(map(category => category ? lowerCase(category) : this.defaultCategoryDisplayName));
        this.creditCards$ = this.category$.pipe(
            tap(() => { abp.ui.setBusy(this.creditCardsListRef.nativeElement); this.creditCardsAmount = undefined; }),
            switchMap(category => this.offerServiceProxy.getAll(category, Type.TrafficDistribution, 'US').pipe(
                finalize(() => {
                    this.creditCardloaded = true;
                    abp.ui.clearBusy(this.creditCardsListRef.nativeElement);
                    this.changeDetectorRef.detectChanges();
                })
            )),
            tap(creditCards => {
                this.creditCardsAmount = creditCards.length;
                this.changeDetectorRef.detectChanges();
            }),
            publishReplay(),
            refCount(),
            /** @todo remove to avoid hardcoded data */
            map(creditCards => creditCards.map(creditCard => {
                    return {
                        ...creditCard,
                        ...{
                            'annualFee': '$45',
                            'rewardsRate': '1.5% cashback',
                            'rewardsBonus': '$100',
                            'apr': '5.5%',
                            'rating': Math.floor(Math.random() * 5) + 1,
                            'reviewsAmount': Math.floor(Math.random() * 1000) + 1
                        }
                    };
                }))
        );

        /** Insert filters values from credit cards data */
        this.creditCards$.pipe(takeUntil(this.deactivate$)).subscribe(creditCards => {
            /** @todo uncomment in future when data will be good for filtering */
            //this.fullFillFilterValues(creditCards);
            this.hideTooBigFilters();
        });
        this.createFiltersObject();
        this.displayedCreditCards$ =
            //combineLatest(
                this.creditCards$; //,
                //this.selectedFilter$,
                //this.selectedSorting$
            //).pipe(
                //takeUntil(this.deactivate$),
                // map(([creditCards, filtersValues, sortingField]) => this.sortCards(
                //     this.filterCards(creditCards, filtersValues),
                //     sortingField
                // ))
            //);
        this.displayedCreditCards$.pipe(takeUntil(this.deactivate$)).subscribe((displayedCreditCards: CampaignDto[]) => {
            this.offersService.displayedCards = displayedCreditCards;
        });

        /** Set overflow hidden to container */
        this.rootComponent.overflowHidden(false);
    }

    /**
     * Fullfill filters with credit cards values
     * @param {CampaignDto[]} CampaignDto
     */
    private fullFillFilterValues(creditCards: CampaignDto[]) {
        // creditCards.forEach(creditCard => {
        //     this.filters.forEach(filter => {
        //         if (creditCard[filter.field] !== undefined && filter.values['indexOf'](creditCard[filter.field]) === -1) {
        //             filter.values['push'](creditCard[filter.field]);
        //         }
        //     });
        // });
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

    viewCardDetails(card: CampaignDto) {
        this.router.navigate(['/personal-finance/offer', card.id], { relativeTo: this.route });
    }

    toggleFiltering(e) {
        this.filtersSideBar.nativeElement.classList.contains('xs-hidden')
            ? this.renderer.removeClass(this.filtersSideBar.nativeElement, 'xs-hidden')
            : this.renderer.addClass(this.filtersSideBar.nativeElement, 'xs-hidden');
    }

    toggleSorting(e) {
        this.sortingSelect.toggle();
    }

    applyOffer(offer: CampaignDto) {
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.id,
            systemType: 'EPCVIP'
        });
        abp.ui.setBusy(this.creditCardsListRef.nativeElement);
        this.offerServiceProxy.submitApplication(submitApplicationInput)
                              .pipe(finalize(() => abp.ui.clearBusy(this.creditCardsListRef.nativeElement)))
                              .subscribe((output: SubmitApplicationOutput) => {
                                 if (!offer.redirectUrl) {
                                     window.open(output.redirectUrl, '_blank');
                                 }
                              });
        if (offer.redirectUrl) {
            window.open(offer.redirectUrl, '_blank');
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
        this.rootComponent.overflowHidden(false);
    }
}

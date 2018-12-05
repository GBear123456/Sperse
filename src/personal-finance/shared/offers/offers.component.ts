/** Core imports */
import {
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
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { first, finalize, map, publishReplay, refCount, takeUntil, tap, pluck, switchMap } from 'rxjs/operators';
import { isEmpty, kebabCase, pickBy } from 'lodash';
import { MatSelect, MatSelectChange, MatSliderChange } from '@angular/material';

/** Third party improrts */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    CampaignDto,
    Category,
    Type,
    OfferServiceProxy,
    SubmitApplicationInput,
    SubmitApplicationOutput
} from '@shared/service-proxies/service-proxies';
import { CurrencyPipe } from '@angular/common';
import { NumberAbbrPipe } from '@shared/common/pipes/number-abbr/number-abbr.pipe';

interface FilterValues {
    [field: string]: { [filterValue: string]: string };
}

enum FilterType {
    Checkbox,
    Range,
    Select
}

interface StepCondition {
    min: number;
    max: number;
    step: number;
    sliderMin?: number;
}

interface Filter {
    name: string;
    field: string;
    type: FilterType;
    min?: number;
    max?: number;
    step?: number;
    stepsConditions?: StepCondition[];
    value?: any;
    value$?: any;
    values$?: Observable<any[]>;
    showAll?: boolean;
    fullBackground?: boolean;
    onChange?: (category) => void;
    minMaxDisplayFunction?: (value: number) => string;
    valueDisplayFunction?: (value: number) => string | { name: string, description: string };
}

@Component({
    templateUrl: './offers.component.html',
    styleUrls: [ './offers.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ CurrencyPipe, NumberAbbrPipe ]
})
export class OffersComponent implements OnInit, OnDestroy {
    @ViewChild('offersList') offersListRef: ElementRef;
    @ViewChild('filtersSideBar') filtersSideBar: ElementRef;
    @ViewChild('sortingSelect') sortingSelect: MatSelect;
    private offers$: Observable<any>;
    displayedOffers$: Observable<any>;
    offersAmount: number;
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
    private creditScores = {
        'bad': {
            min: 0,
            max: 549
        },
        'poor': {
            min: 550,
            max: 649
        },
        'fair': {
            min: 650,
            max: 699
        },
        'good': {
            min: 700,
            max: 749
        },
        'excellent': {
            min: 750,
            max: 850
        }
    };
    category$: Observable<Category> = this.offersService.getCategoryFromRoute(this.route.params);
    filtersSettings: { [filterGroup: string]: Filter[] } = {
        'loans': [
            {
                name: this.ls.l('Offers_Filter_Amount'),
                field: 'amount',
                type: FilterType.Range,
                min: 100,
                max: 100000,
                value: 5000,
                step: 100,
                stepsConditions: [
                    {
                        min: 0,
                        max: 1999,
                        step: 100,
                        sliderMin: 100
                    },
                    {
                        min: 2000,
                        max: 100000,
                        step: 1000,
                        sliderMin: 0 // To avoid numbers like 2100, 3100 etc
                    }
                ],
                minMaxDisplayFunction: (value: number) => this.numberAbbrPipe.transform(value),
                valueDisplayFunction: (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '0.0-0')
            },
            {
                name: this.ls.l('Offers_Filter_CreditScore'),
                field: 'creditScore',
                type: FilterType.Range,
                min: 350,
                max: 850,
                value: 700,
                step: 50,
                fullBackground: true,
                valueDisplayFunction: (value: number) => {
                    for (let scoreName in this.creditScores) {
                        if (value >= this.creditScores[scoreName].min && value <= this.creditScores[scoreName].max) {
                            return {
                                name: this.ls.l('Offers_CreditScore_' + scoreName),
                                description: `(${this.creditScores[scoreName].min}-${this.creditScores[scoreName].max})`
                            };
                        }
                    }
                }
            },
            {
                name: this.ls.l('Offers_Filter_LoanType'),
                field: 'type',
                type: FilterType.Select,
                values$: of([
                    {
                        name: this.ls.l('Offers_PersonalLoans'),
                        value: Category.PersonalLoans
                    },
                    {
                        name: this.ls.l('Offers_PaydayLoans'),
                        value: Category.PaydayLoans
                    },
                    {
                        name: this.ls.l('Offers_InstallmentLoans'),
                        value: Category.InstallmentLoans
                    },
                    {
                        name: this.ls.l('Offers_BusinessLoans'),
                        value: Category.BusinessLoans
                    },
                    {
                        name: this.ls.l('Offers_AutoLoans'),
                        value: Category.AutoLoans
                    }
                ]),
                value$: this.category$,
                onChange: (e: MatSelectChange) => {
                    this.router.navigate(['../' + kebabCase(e.value)], { relativeTo: this.route });
                }
            },
            {
                name: this.ls.l('Offers_Filter_ResidentState'),
                field: 'residentState',
                type: FilterType.Select,
                values$: this.store$.pipe(
                    select(StatesStoreSelectors.getState, {
                        countryCode: 'US'
                    }),
                    map(states => states.map(state => state.name))
                )
            }
        ],
        'default': [
            {
                name: this.ls.l('Offers_Filter_Brand'),
                field: 'bankName',
                type: FilterType.Checkbox,
                values$: of([ 'American Express', 'Bank of America', 'Barclaycard', 'Capital One', 'Chase' ]),
                showAll: false
            },
            {
                name: this.ls.l('Offers_Filter_Type'),
                field: 'type',
                type: FilterType.Checkbox,
                values$: of([ 'Small business', 'Personal' ]),
                showAll: false
            },
            {
                name: this.ls.l('Offers_Filter_Category'),
                field: 'category',
                type: FilterType.Checkbox,
                values$: of([ 'Best current offers', 'Flexible points', 'Hotel points', 'Airline miles', 'Cashback' ]),
                showAll: false
            },
            {
                name: this.ls.l('Offers_Filter_Network'),
                field: 'network',
                type: FilterType.Checkbox,
                values$: of([ 'AmEx', 'Visa', 'Master', 'Diners Club', 'Cashback' ]),
                showAll: false
            },
            {
                name: this.ls.l('Offers_Filter_Rating'),
                field: 'rating',
                type: FilterType.Checkbox,
                values$: of([ 5, 4, 3, 2, 1 ]),
                showAll: false
            }
        ]
    };
    filters$: Observable<Filter[]>;
    filtersValues: FilterValues = {};
    filterType = FilterType;
    maxDisplayedFilterValues = 5;
    selectedFilter = new BehaviorSubject(this.filtersValues);
    private selectedFilter$ = this.selectedFilter.asObservable();

    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();

    selectedSorting: BehaviorSubject<string> = new BehaviorSubject(this.sortings[0].field);
    private selectedSorting$ = this.selectedSorting.asObservable();
    offersLoaded = false;
    categoryDisplayName$: Observable<string>;

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private router: Router,
        private offersService: OffersService,
        private renderer: Renderer2,
        private route: ActivatedRoute,
        private offerServiceProxy: OfferServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<RootStore.State>,
        private currencyPipe: CurrencyPipe,
        private numberAbbrPipe: NumberAbbrPipe
    ) {
    }

    ngOnInit() {
        this.activate();
    }

    activate() {
        this.filters$ = this.category$.pipe(
            map((category: Category) => this.getFiltersForCategory(category)),
            map(filters => this.hideTooBigFilters(filters))
        );
        this.categoryDisplayName$ = this.category$.pipe(map(category => this.offersService.getCategoryDisplayName(category)));
        this.offers$ = this.category$.pipe(
            tap(() => { abp.ui.setBusy(this.offersListRef.nativeElement); this.offersAmount = undefined; }),
            switchMap(category => this.offerServiceProxy.getAll(category, undefined, 'US', undefined).pipe(
                finalize(() => {
                    this.offersLoaded = true;
                    abp.ui.clearBusy(this.offersListRef.nativeElement);
                    this.changeDetectorRef.detectChanges();
                })
            )),
            tap(offers => {
                this.offersAmount = offers.length;
                this.changeDetectorRef.detectChanges();
            }),
            publishReplay(),
            refCount(),
            /** @todo remove to avoid hardcoded data */
            map(offers => offers.map(offer => {
                    return {
                        ...offer,
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
        this.offers$.pipe(takeUntil(this.deactivate$), map((offers: CampaignDto[]) => {
            /** @todo uncomment in future when data will be good for filtering */
            //this.fullFillFilterValues(offers);
        }));
        this.createFiltersObject();
        this.displayedOffers$ =
            //combineLatest(
                this.offers$; //,
                //this.selectedFilter$,
                //this.selectedSorting$
            //).pipe(
                //takeUntil(this.deactivate$),
                // map(([offers, filtersValues, sortingField]) => this.sortCards(
                //     this.filterOffers(offers, filtersValues),
                //     sortingField
                // ))
            //);
        this.displayedOffers$.pipe(takeUntil(this.deactivate$)).subscribe((displayedCreditCards: CampaignDto[]) => {
            this.offersService.displayedCards = displayedCreditCards;
        });
    }

    private getFiltersForCategory(category: Category): Filter[] {
        let filters = this.filtersSettings['default'];
        switch (category) {
            case Category.PersonalLoans:
            case Category.PaydayLoans:
            case Category.InstallmentLoans:
            case Category.BusinessLoans:
            case Category.AutoLoans: {
                this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
                filters = this.filtersSettings['loans'];
            }
        }
        return filters;
    }

    /**
     * Fullfill filters with credit cards values
     * @param {CampaignDto[]} CampaignDto
     */
    private fullFillFilterValues(offers: CampaignDto[]) {
        // offers.forEach(offer => {
        //     this.filters.forEach(filter => {
        //         if (offer[filter.field] !== undefined && filter.values['indexOf'](offer[filter.field]) === -1) {
        //             filter.values['push'](offer[filter.field]);
        //         }
        //     });
        // });
    }

    private hideTooBigFilters(filters: Filter[]) {
        /** Change whether to dispay all filter values */
        filters.forEach(filter => {
            if (filter.values$) {
                filter.values$.pipe(first()).subscribe(filterValues => {
                    if (filterValues.length <= this.maxDisplayedFilterValues) {
                        filter.showAll = true;
                    }
                });
            }
        });
        return filters;
    }

    private createFiltersObject() {
        // this.filters.forEach(filter => this.filtersValues[filter.field] = {});
    }

    filterOffers(offers: any[], filtersValues: FilterValues): any[] {
        return offers.filter( offer => {
            for (let field in filtersValues) {
                const cardFieldValue = offer[field];
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

    sortCards(offers: any[], field: string): any[]  {
        return offers.sort((cardA, cardB) => {
            /** If values are numbers - sort in another order */
            return (cardA[field] > cardB[field] ? 1 : -1) * (!isNaN(cardA[field]) ? -1 : 1);
        });
    }

    viewCardDetails(card: CampaignDto) {
        this.router.navigate(['./', card.id], { relativeTo: this.route });
    }

    toggleFiltering(e) {
        this.filtersSideBar.nativeElement.classList.contains('md-hidden')
            ? this.renderer.removeClass(this.filtersSideBar.nativeElement, 'md-hidden')
            : this.renderer.addClass(this.filtersSideBar.nativeElement, 'md-hidden');
    }

    toggleSorting(e) {
        this.sortingSelect.toggle();
    }

    applyOffer(offer: CampaignDto) {
        const submitApplicationInput = SubmitApplicationInput.fromJS({
            campaignId: offer.id,
            systemType: 'EPCVIP'
        });
        abp.ui.setBusy(this.offersListRef.nativeElement);
        this.offerServiceProxy.submitApplication(submitApplicationInput)
                              .pipe(finalize(() => abp.ui.clearBusy(this.offersListRef.nativeElement)))
                              .subscribe((output: SubmitApplicationOutput) => {
                                 if (!offer.redirectUrl) {
                                     window.open(output.redirectUrl, '_blank');
                                 }
                              });
        if (offer.redirectUrl) {
            window.open(offer.redirectUrl, '_blank');
        }
    }

    changeStep(sliderChange: MatSliderChange, stepsConditions: StepCondition[]) {
        if (stepsConditions && stepsConditions.length) {
            stepsConditions.some(condition => {
                if (sliderChange.value >= condition.min && sliderChange.value <= condition.max) {
                    sliderChange.source.step = condition.step;
                    sliderChange.source.min = condition.sliderMin;
                    return true;
                }
            });
        }
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
    }
}

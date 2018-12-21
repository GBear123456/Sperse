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
    Renderer2,
    ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { first, filter, finalize, map, publishReplay, refCount, takeUntil, tap, pluck, switchMap, skip } from 'rxjs/operators';
import { kebabCase, capitalize } from 'lodash';
import { MatRadioChange, MatSelect, MatSelectChange, MatSliderChange } from '@angular/material';

/** Third party imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    CampaignDto,
    Category,
    OfferServiceProxy,
    SubmitApplicationInput,
    SubmitApplicationOutput,
    GetMemberInfoResponse,
    CreditScore
} from '@shared/service-proxies/service-proxies';
import { CurrencyPipe } from '@angular/common';
import { NumberAbbrPipe } from '@shared/common/pipes/number-abbr/number-abbr.pipe';
import { FilterSettingInterface } from '@root/personal-finance/shared/offers/interfaces/filter-setting.interface';
import { StepConditionInterface } from '@root/personal-finance/shared/offers/interfaces/step-condition.interface';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { RangeFilterSetting } from '@root/personal-finance/shared/offers/filters-settings/range-filter-setting';
import { SelectFilterSetting } from '@root/personal-finance/shared/offers/filters-settings/select-filter-setting';
import { RadioFilterSetting } from '@root/personal-finance/shared/offers/filters-settings/radio-filter-setting';
import { CheckboxFilterSetting } from '@root/personal-finance/shared/offers/filters-settings/checkbox-filter-setting';

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
    offersAmount: number = null;
    get offersAreLoading() {
        return this.offersAmount === null;
    }
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
        'poor': {
            min: 0,
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
    memberInfo$: Observable<GetMemberInfoResponse> = this.offerServiceProxy.getMemberInfo().pipe(publishReplay(), refCount(), finalize(abp.ui.clearBusy));
    creditScore$: Observable<number> = this.memberInfo$.pipe(pluck('creditScore'), map((score: CreditScore) => this.covertCreditScoreToNumber(score)));
    stateCode$: Observable<string> = this.memberInfo$.pipe(pluck('stateCode'));
    filtersSettings: { [filterGroup: string]: FilterSettingInterface[] } = {
        'loans': [
            new RangeFilterSetting({
                name: this.ls.l('Offers_Filter_Amount'),
                min: 100,
                max: 100000,
                value$: of(5000),
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
                minMaxDisplayFunction: (value: number) => this.numberAbbrPipe.transform(value, '$'),
                valueDisplayFunction: (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '0.0-0')
            }),
            new RangeFilterSetting({
                name: this.ls.l('Offers_Filter_CreditScore'),
                min: 350,
                max: 850,
                step: 50,
                fullBackground: true,
                valueDisplayFunction: (value: number) => {
                    let scoreName = this.getCreditScoreName(value);
                    return {
                        name: this.ls.l('Offers_CreditScore_' + scoreName),
                        description: `(${this.creditScores[scoreName].min}-${this.creditScores[scoreName].max})`
                    };
                },
                value$: this.creditScore$,
                onChange: (e: MatSliderChange) => {
                    if (this.filtersValues.creditScore != e.value) {
                        this.filtersValues.creditScore = e.value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_LoanType'),
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
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_ResidentState'),
                value$: this.stateCode$,
                values$: this.store$.pipe(
                    select(StatesStoreSelectors.getState, {
                        countryCode: 'US'
                    }),
                    map(states => states.map(state => ({ name: state.name, value: state.code })))
                )
            })
        ],
        'creditScore': [
            new RadioFilterSetting({
                values$: of([
                    {
                        name: this.ls.l('Offers_CreditScore'),
                        value: Category.CreditScore
                    },
                    {
                        name: this.ls.l('Offers_CreditRepair'),
                        value: Category.CreditRepair
                    },
                    {
                        name: this.ls.l('Offers_CreditMonitoring'),
                        value: Category.CreditMonitoring
                    },
                    {
                        name: this.ls.l('Offers_DebtConsolidation'),
                        value: Category.DebtConsolidation
                    }
                ]),
                value$: this.category$,
                navigation: true,
                onChange: (e: MatRadioChange) => {
                    this.router.navigate(['../' + kebabCase(e.value)], { relativeTo: this.route });
                }
            })
        ],
        'default': [
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Brand'),
                values$: of([ 'American Express', 'Bank of America', 'Barclaycard', 'Capital One', 'Chase' ]),
                showAll: false
            }),
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Type'),
                values$: of([ 'Small business', 'Personal' ]),
                showAll: false
            }),
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Category'),
                values$: of([ 'Best current offers', 'Flexible points', 'Hotel points', 'Airline miles', 'Cashback' ]),
                showAll: false
            }),
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Network'),
                values$: of([ 'AmEx', 'Visa', 'Master', 'Diners Club', 'Cashback' ]),
                showAll: false
            }),
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Rating'),
                values$: of([ 5, 4, 3, 2, 1 ]),
                showAll: false
            })
        ]
    };
    filters$: Observable<FilterSettingInterface[]>;
    filtersValues = {
        category: undefined,
        type: undefined,
        country: 'US',
        creditScore: 700
    };
    filterType = FilterType;
    maxDisplayedFilterValues = 5;
    selectedFilter = new BehaviorSubject(this.filtersValues);
    private selectedFilter$: Observable<any>;

    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();

    selectedSorting: BehaviorSubject<string> = new BehaviorSubject(this.sortings[0].field);
    private selectedSorting$ = this.selectedSorting.asObservable();
    categoryDisplayName$: Observable<string>;
    buttonCaption: string = 'Apply';

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
        this.category$.subscribe((category) => {    
            if (!category)
                return this.router.navigate(['/personal-finance/home']);

            switch(category) {
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

            abp.ui.setBusy();
            this.selectedFilter$ = combineLatest(this.creditScore$, this.category$)
                .pipe(
                    first(),
                    switchMap(([creditScore, category]) => {
                        this.filtersValues.creditScore = creditScore;
                        this.filtersValues.category = category;
                        this.selectedFilter.next(this.filtersValues);
                        return this.selectedFilter.asObservable();
                    })
                );
            this.activate();
        });
    }

    activate() {
        this.filters$ = this.category$.pipe(
            map((category: Category) => this.getFiltersForCategory(category)),
            map(filters => this.hideTooBigFilters(filters))
        );
        this.category$.pipe(
            takeUntil(this.deactivate$),
            skip(1),
            filter(category => category != this.filtersValues.category)
        ).subscribe((category) => {
            this.filtersValues.category = category;
            this.selectedFilter.next(this.filtersValues);
        });

        this.categoryDisplayName$ = this.category$.pipe(map(category => this.offersService.getCategoryDisplayName(category)));
        this.offers$ = this.selectedFilter$.pipe(
            takeUntil(this.deactivate$),
            tap(() => { abp.ui.setBusy(this.offersListRef.nativeElement); this.offersAmount = null; }),
            switchMap(filter => this.offerServiceProxy.getAll(
                filter.category,
                undefined,
                filter.country,
                this.covertNumberToCreditScore(filter.creditScore),
                filter.category
            ).pipe(
                finalize(() => {
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

    private getFiltersForCategory(category: Category): FilterSettingInterface[] {
        let filters = this.filtersSettings['default'];
        switch (category) {
            case Category.PersonalLoans:
            case Category.PaydayLoans:
            case Category.InstallmentLoans:
            case Category.BusinessLoans:
            case Category.AutoLoans: {
                this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'));
                filters = this.filtersSettings['loans'];
                break;
            }
            case Category.CreditScore:
            case Category.CreditRepair:
            case Category.CreditMonitoring:
            case Category.DebtConsolidation: {
                filters = this.filtersSettings['creditScore'];
                break;
            }
        }
        return filters;
    }

    private hideTooBigFilters(filters) {
        /** Change whether to display all filter values */
        filters.forEach((filter) => {
            if (filter.type === FilterType.Checkbox && filter.values$) {
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
        this.offersService.applyOffer(offer, this.filtersValues.category);
    }

    changeStep(sliderChange: MatSliderChange, stepsConditions: StepConditionInterface[]) {
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

    private getCreditScoreName(value: number): string {
        for (let scoreName in this.creditScores) {
            if (value >= this.creditScores[scoreName].min && value <= this.creditScores[scoreName].max) {
                return scoreName;
            }
        }
    }

    private covertCreditScoreToNumber(score: CreditScore): number {
        if (score) {
            let scoreName = (score as string).toLowerCase();
            if (this.creditScores[scoreName])
                return this.creditScores[scoreName].max;
        }

        return 700;
    }

    private covertNumberToCreditScore(scoreNumber: number): CreditScore {
        let scoreName = capitalize(this.getCreditScoreName(scoreNumber));
        if (CreditScore[scoreName])
            return <any>CreditScore[scoreName];

        return CreditScore.NotSure;
    }

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
    }
}

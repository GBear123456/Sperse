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
import {
    first,
    filter,
    finalize,
    map,
    mergeMap,
    publishReplay,
    refCount,
    takeUntil,
    tap,
    pluck,
    switchMap,
    skip,
    withLatestFrom, distinct, toArray
} from 'rxjs/operators';
import { kebabCase } from 'lodash';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatSliderChange } from '@angular/material/slider';

/** App part imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    OfferDto,
    Category,
    OfferServiceProxy,
    CreditScore
} from '@shared/service-proxies/service-proxies';
import { CurrencyPipe } from '@angular/common';
import { NumberAbbrPipe } from '@shared/common/pipes/number-abbr/number-abbr.pipe';
import { FilterSettingInterface } from '@root/personal-finance/shared/offers/filters/interfaces/filter-setting.interface';
import { StepConditionInterface } from '@root/personal-finance/shared/offers/interfaces/step-condition.interface';
import { FilterType } from '@root/personal-finance/shared/offers/filter-type.enum';
import { RangeFilterSetting } from '@root/personal-finance/shared/offers/filters/filters-settings/range-filter-setting';
import { SelectFilterModel, SelectFilterSetting } from '@root/personal-finance/shared/offers/filters/filters-settings/select-filter-setting';
import { CheckboxFilterSetting } from '@root/personal-finance/shared/offers/filters/filters-settings/checkbox-filter-setting';
import { CategoryGroupEnum } from '@root/personal-finance/shared/offers/category-group.enum';
import { ChooserFilterSetting, ChooserDesign, ChooserType } from '@root/personal-finance/shared/offers/filters/filters-settings/chooser-filter-setting';
import { ChooserOption } from '@root/personal-finance/shared/offers/filters/chooser-filter/chooser-filter.component';
import { ScoreFilterSetting } from '@root/personal-finance/shared/offers/filters/filters-settings/score-filter-setting';
import { CreditScoreItem } from '@root/personal-finance/shared/offers/filters/interfaces/score-filter.interface';

export class FilterValues {
    category: Category;
    country: string;
    creditScore: number;
    brand: string;
    loanAmount: number;
}

@Component({
    templateUrl: './offers-layout.component.html',
    styleUrls: [ './offers-layout.component.less' ],
    selector: 'offers-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ CurrencyPipe, NumberAbbrPipe ]
})
export class OffersLayoutComponent implements OnInit, OnDestroy {
    @ViewChild('offersList') offersListRef: ElementRef;
    @ViewChild('filtersSideBar') filtersSideBar: ElementRef;
    @ViewChild('sortingSelect') sortingSelect: MatSelect;
    offers$: Observable<any>;
    displayedOffers$: Observable<any>;

    hideFilters = true;
    offersAmount: number;
    offersAreLoading = false;
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
    defaultVisibleOffers = 6;
    visibleOffers: number;
    itemsCount: number;
    brands$: BehaviorSubject<SelectFilterModel[]> = new BehaviorSubject<SelectFilterModel[]>([]);
    category$: Observable<Category> = this.offersService.getCategoryFromRoute(this.route);
    categoryGroup$: Observable<CategoryGroupEnum> = this.category$.pipe(map((category: Category) => this.offersService.getCategoryGroup(category)));
    categoryDisplayName$: Observable<string> = this.category$.pipe(map(category => this.offersService.getCategoryDisplayName(category)));
    creditScore$: Observable<number> = this.offersService.memberInfo$.pipe(pluck('creditScore'), map((score: CreditScore) => this.offersService.covertCreditScoreToNumber(score)));
    stateCode$: Observable<string> = this.offersService.memberInfo$.pipe(pluck('stateCode'));
    filtersValues: FilterValues = this.getDefaultFilters();
    filtersSettings: { [filterGroup: string]: FilterSettingInterface[] } = {
        [CategoryGroupEnum.Loans]: [
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
                selected$: this.category$,
                onChange: (e: MatSelectChange) => {
                    this.router.navigate(['../' + kebabCase(e.value)], { relativeTo: this.route });
                }
            }),
            new SelectFilterSetting({
                name: this.ls.l('Credit_Score_Filter'),
                values$: of([
                    {
                        name: this.ls.l('Score_Excellent'),
                        value: CreditScore.Excellent
                    },
                    {
                        name: this.ls.l('Score_Good'),
                        value: CreditScore.Good
                    },
                    {
                        name: this.ls.l('Score_Fair'),
                        value: CreditScore.Fair
                    },
                    {
                        name: this.ls.l('Score_Bad'),
                        value: CreditScore.Poor
                    },
                    {
                        name: this.ls.l('Score_NoScore'),
                        value: CreditScore.NotSure
                    }
                ]),
                selected$: this.creditScore$.pipe(map((creditScore: CreditScore) => {
                    return this.filtersValues.creditScore && this.offersService.covertNumberToCreditScore(this.filtersValues.creditScore) || creditScore;
                })),
                onChange: (e: MatSelectChange) => {
                    const filterValue: number = <any>this.offersService.covertCreditScoreToNumber(e.value);
                    if (this.filtersValues.creditScore != filterValue) {
                        this.filtersValues.creditScore = filterValue;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new RangeFilterSetting({
                name: this.ls.l('Offers_Filter_Amount'),
                min: 500,
                max: 100000,
                selected$: of(10000),
                step: 500,
                minMaxDisplayFunction: (value: number) => this.numberAbbrPipe.transform(value, '$'),
                valueDisplayFunction: (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '0.0-0'),
                onChange: (e: MatSliderChange) => {
                    if (this.filtersValues.loanAmount != e.value) {
                        this.filtersValues.loanAmount = e.value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),

            new RangeFilterSetting({
                name: this.ls.l('Annual_Income_Filter'),
                min: 500,
                max: 100000,
                selected$: of(55000),
                step: 500,
                minMaxDisplayFunction: (value: number) => this.numberAbbrPipe.transform(value, '$'),
                valueDisplayFunction: (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '0.0-0')
            }),

            // new RangeFilterSetting({
            //     name: this.ls.l('Offers_Filter_CreditScore'),
            //     min: 300,
            //     max: 850,
            //     step: 50,
            //     fullBackground: true,
            //     valueDisplayFunction: (value: number) => {
            //         let scoreName = this.offersService.getCreditScoreName(value);
            //         /** @todo remove in future */
            //         scoreName = scoreName === 'notsure' ? 'poor' : scoreName;
            //         return {
            //             name: this.ls.l('Offers_CreditScore_' + scoreName),
            //             description: `(${this.offersService.creditScores[scoreName].min}-${this.offersService.creditScores[scoreName].max})`
            //         };
            //     },
            //     selected$: this.creditScore$.pipe(map((creditScore: CreditScore) => {
            //         return this.filtersValues.creditScore || creditScore;
            //     })),
            //     onChange: (e: MatSliderChange) => {
            //         if (this.filtersValues.creditScore != e.value) {
            //             this.filtersValues.creditScore = e.value;
            //             this.selectedFilter.next(this.filtersValues);
            //         }
            //     }
            // }),

            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_ResidentState'),
                selected$: this.stateCode$,
                values$: this.store$.pipe(
                    select(StatesStoreSelectors.getState, { countryCode: 'US' }),
                    map(states => states.map(state => ({ name: state.name, value: state.code })))
                )
            })
        ],
        [CategoryGroupEnum.CreditCards]: [
            new ScoreFilterSetting({
                name: this.ls.l('Offers_Filter_CreditScore'),
                values$: of([
                    {
                        name: 'Excellent',
                        value: CreditScore.Excellent,
                        min: 720,
                        max: 850
                    },
                    {
                        name: 'Good',
                        value: CreditScore.Good,
                        min: 690,
                        max: 719
                    },
                    {
                        name: 'Fair',
                        value: CreditScore.Fair,
                        min: 630,
                        max: 689
                    },
                    {
                        name: 'Bad',
                        value: CreditScore.Poor,
                        min: 300,
                        max: 629
                    },
                    {
                        name: 'Limited or No Score',
                        value: CreditScore.NotSure
                    }
                ]),
                selected$: this.creditScore$.pipe(map((creditScore: CreditScore) => {
                    return this.filtersValues.creditScore && this.offersService.covertNumberToCreditScore(this.filtersValues.creditScore) || creditScore;
                })),
                onChange: (creditScore: CreditScoreItem) => {
                    const filterValue: number = <any>this.offersService.covertCreditScoreToNumber(creditScore.value);
                    if (this.filtersValues.creditScore != filterValue) {
                        this.filtersValues.creditScore = filterValue;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new ChooserFilterSetting({
                name: this.ls.l('Offers_Filter_Category'),
                chooserDesign: ChooserDesign.Combined,
                chooserType: ChooserType.Single,
                values$: of([
                    /** @todo change values to enums */
                    {
                        name: this.ls.l('Offers_Credit'),
                        value: 'credit',
                        selected: true
                    },
                    {
                        name: this.ls.l('Offers_Debit'),
                        value: 'debit'
                    },
                    {
                        name: this.ls.l('Offers_Prepaid'),
                        value: 'prepaid'
                    }
                ]),
                selected$: of('credit'),
                onChange: (selectedValues: ChooserOption[]) => {}
            }),
            new ChooserFilterSetting({
                name: this.ls.l('Offers_Filter_Type'),
                chooserDesign: ChooserDesign.Combined,
                chooserType: ChooserType.Single,
                values$: of([
                    /** @todo change values to enums */
                    {
                        name: this.ls.l('Offers_Personal'),
                        value: 'personal'
                    },
                    {
                        name: this.ls.l('Offers_Student'),
                        value: 'student',
                        selected: true
                    },
                    {
                        name: this.ls.l('Offers_Business'),
                        value: 'business'
                    }
                ]),
                selected$: of('credit'),
                onChange: (selectedValues: ChooserOption[]) => {}
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Rating'),
                values$: of([ '5', '4', '3', '2', '1' ].map(value => ({ name: value, value: value }) )),
                selected$: of('3'),
                templateName: 'rating'
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Brand'),
                values$: this.brands$
            }),
            new ChooserFilterSetting({
                name: this.ls.l('Offers_Filter_Network'),
                chooserType: ChooserType.Multi,
                chooserDesign: ChooserDesign.Separate,
                values$: of([
                    /** @todo change values to enums */
                    {
                        iconSrc: './assets/common/icons/offers/visa.svg',
                        value: 'visa',
                        selected: true
                    },
                    {
                        iconSrc: './assets/common/icons/offers/mastercard.svg',
                        value: 'mastercard'
                    },
                    {
                        iconSrc: './assets/common/icons/offers/discover.svg',
                        value: 'discover'
                    },
                    {
                        iconSrc: './assets/common/icons/offers/american-express.svg',
                        value: 'american-express'
                    }
                ]),
                onChange: (selectedValues: ChooserOption[]) => {}
            })
        ],
        [CategoryGroupEnum.Default]: [
            new CheckboxFilterSetting({
                name: this.ls.l('Offers_Filter_Type'),
                values$: of([ 'Small business', 'Personal' ]),
                showAll: false
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Rating'),
                values$: of([ '5', '4', '3', '2', '1' ].map(value => ({ name: value, value: value }) )),
                templateName: 'rating'
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Brand'),
                values$: this.brands$
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
            })
        ]
    };
    filters$: Observable<FilterSettingInterface[]>;
    filterType = FilterType;
    maxDisplayedFilterValues = 5;
    selectedFilter = new BehaviorSubject(this.filtersValues);
    private selectedFilter$: Observable<FilterValues>;

    private deactivateSubject: Subject<null> = new Subject<null>();
    private deactivate$: Observable<null> = this.deactivateSubject.asObservable();

    selectedSorting: BehaviorSubject<string> = new BehaviorSubject(this.sortings[0].field);
    private selectedSorting$ = this.selectedSorting.asObservable();
    buttonCaption = 'Apply';
    pagePrefix: any;

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
        this.visibleOffers = this.defaultVisibleOffers;
    }

    ngOnInit() {
        this.categoryGroup$.pipe(
            filter((categoryGroup: CategoryGroupEnum) => categoryGroup === CategoryGroupEnum.Loans),
            takeUntil(this.deactivate$)
        ).subscribe(
            () => this.store$.dispatch(new StatesStoreActions.LoadRequestAction('US'))
        );
        this.category$.subscribe((category) => {
            if (!category)
                return this.router.navigate(['/personal-finance/home']);
            this.pagePrefix = category;

            switch (category) {
                case Category.PersonalLoans:
                    this.buttonCaption = 'GetMyRate';
                    break;
                case Category.CreditCards:
                    this.buttonCaption = 'ViewOffers';
                    break;
                case Category.CreditScore:
                    this.buttonCaption = 'GetOffer';
                    break;
            }
        });
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
    }

    activate() {
        this.filters$ = this.categoryGroup$.pipe(
            map((categoryGroup: CategoryGroupEnum) => this.filtersSettings[categoryGroup]),
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
        this.offers$ = this.selectedFilter$.pipe(
            takeUntil(this.deactivate$),
            tap(() => { abp.ui.setBusy(this.offersListRef.nativeElement); this.offersAreLoading = true; }),
            withLatestFrom(this.offersService.memberInfo$),
            switchMap(
                ([filter, memberInfo]) => {
                    return this.offerServiceProxy.getAll(
                        memberInfo.testMode,
                        memberInfo.isDirectPostSupported,
                        filter.category,
                        undefined,
                        filter.country,
                        this.offersService.getCreditScore(filter.category, filter.creditScore),
                        undefined,
                        undefined,
                        filter.loanAmount,
                        undefined,
                        undefined,
                        undefined
                    ).pipe(
                        finalize(() => {
                            this.offersAreLoading = false;
                            abp.ui.clearBusy(this.offersListRef.nativeElement);
                            this.changeDetectorRef.detectChanges();
                        }),
                        tap((offers: OfferDto[]) => {
                            if (!this.brands$.value.length) {
                                this.getBrandsFromOffers(of(offers)).subscribe(
                                    (brands: SelectFilterModel[]) => this.brands$.next(brands)
                                );
                            }
                        })
                    );
                }
            ),
            tap(offers => {
                this.offersAmount = offers.length;
                this.changeDetectorRef.detectChanges();
            }),
            publishReplay(),
            refCount()
        );

        /** Insert filters values from credit cards data */
        this.offers$.pipe(takeUntil(this.deactivate$), map((offers: OfferDto[]) => {
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
        this.displayedOffers$.pipe(takeUntil(this.deactivate$)).subscribe((displayedCreditCards: OfferDto[]) => {
            this.offersService.displayedCards = displayedCreditCards;
            this.itemsCount = displayedCreditCards.length;
        });
    }

    private getBrandsFromOffers(offers: Observable<OfferDto[]>): Observable<SelectFilterModel[]> {
        return offers.pipe(
            mergeMap(x => x),
            pluck('issuingBank'),
            filter(brand => !!brand),
            distinct(),
            map(brand => <SelectFilterModel>({ name: brand, value: brand })),
            toArray()
        );
    }

    private getDefaultFilters() {
        return {
            category: undefined,
            country: 'US',
            creditScore: null,
            brand: null,
            loanAmount: 10000
        };
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

    viewCardDetails(card: OfferDto) {
        this.router.navigate(['./', card.campaignId], { relativeTo: this.route });
    }

    toggleFiltering(e) {
        this.filtersSideBar.nativeElement.classList.contains('md-hidden')
            ? this.renderer.removeClass(this.filtersSideBar.nativeElement, 'md-hidden')
            : this.renderer.addClass(this.filtersSideBar.nativeElement, 'md-hidden');
    }

    toggleSorting(e) {
        this.sortingSelect.toggle();
    }

    applyOffer(offer: OfferDto) {
        this.category$.pipe(first()).subscribe(
            (category: Category) => this.offersService.applyOffer(offer, category === Category.CreditCards)
        );
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

    ngOnDestroy() {
        this.deactivate();
    }

    deactivate() {
        this.deactivateSubject.next();
    }

    showNextItems() {
        this.visibleOffers += this.defaultVisibleOffers;
    }
}

/** Core imports */
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    OnInit,
    AfterViewInit,
    Inject,
    Injector,
    OnDestroy,
    ElementRef,
    ViewChild,
    Renderer2,
    ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

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
import kebabCase from 'lodash/kebabCase';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatSliderChange } from '@angular/material/slider';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';

/** App part imports */
import { MatDialog } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import {
    OfferDto,
    OfferFilterCategory,
    OfferServiceProxy,
    CardNetworks,
    GetAllInputCardType,
    GetAllInputSecuringType,
    GetAllInputTargetAudience,
    GetAllInputCreditScore,
    GetMemberInfoResponseCreditScore,
    GetAllInput,
    GetMemberInfoResponse
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
import { MarcusDetailsComponent } from '@root/personal-finance/shared/offers/marcus-details/marcus-details.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '@shared/AppConsts';

export class FilterValues {
    category: OfferFilterCategory;
    country: string;
    creditScore: number;
    issuingBank: string;
    cardNetworks: CardNetworks[];
    cardType: GetAllInputCardType;
    securingType: GetAllInputSecuringType;
    targetAudience: GetAllInputTargetAudience;
    loanAmount: number;
    state: string;
    annualIncome: number;
    overallRating: number;
}

enum CreditCardCategory {
    Credit,
    Debit,
    Prepaid
}

@Component({
    templateUrl: './offers-layout.component.html',
    styleUrls: [ './offers-layout.component.less' ],
    selector: 'offers-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ CurrencyPipe, NumberAbbrPipe ]
})
export class OffersLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('offersList') offersListRef: ElementRef;
    @ViewChild('filtersSideBar') filtersSideBar: ElementRef;
    @ViewChild('sortingSelect') sortingSelect: MatSelect;
    @ViewChild('filterScroll') filterScroll: DxScrollViewComponent;
    offers$: Observable<any>;
    displayedOffers$: Observable<any>;

    isMobile = AppConsts.isMobile;
    hideFilters = this.isMobile;
    offersCount: number;
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
    readonly defaultVisibleOffersCount = 6;
    visibleOffersCount = this.defaultVisibleOffersCount;
    brands$: BehaviorSubject<SelectFilterModel[]> = new BehaviorSubject<SelectFilterModel[]>([]);
    category$: Observable<OfferFilterCategory> = OffersService.getCategoryFromRoute(this.route);
    categoryGroup$: Observable<CategoryGroupEnum> = this.category$.pipe(map((category: OfferFilterCategory) => this.offersService.getCategoryGroup(category)));
    categoryDisplayName$: Observable<string> = this.category$.pipe(map(category => this.offersService.getCategoryDisplayName(category)));

    creditScore$: Observable<number> = this.offersService.memberInfo$.pipe(pluck('creditScore'), map((score: GetMemberInfoResponseCreditScore) => this.offersService.convertCreditScoreToNumber(score)));

    filtersValues: FilterValues = this.getDefaultFilters();
    filtersSettings: { [filterGroup: string]: FilterSettingInterface[] } = {
        [CategoryGroupEnum.Loans]: [
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_LoanType'),
                values$: of([
                    {
                        name: this.ls.l('Offers_PersonalLoans'),
                        value: OfferFilterCategory.PersonalLoans
                    }].concat(this._sessionService.isLendspaceDemoUser ? [] : 
                    [{
                        name: this.ls.l('Offers_PaydayLoans'),
                        value: OfferFilterCategory.PaydayLoans
                    },
                    {
                        name: this.ls.l('Offers_InstallmentLoans'),
                        value: OfferFilterCategory.InstallmentLoans
                    }], [
                    {
                        name: this.ls.l('Offers_BusinessLoans'),
                        value: OfferFilterCategory.BusinessLoans
                    },
                    {
                        name: this.ls.l('Offers_AutoLoans'),
                        value: OfferFilterCategory.AutoLoans
                    }]
                )),
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
                        value: GetMemberInfoResponseCreditScore.Excellent
                    },
                    {
                        name: this.ls.l('Score_Good'),
                        value: GetMemberInfoResponseCreditScore.Good
                    },
                    {
                        name: this.ls.l('Score_Fair'),
                        value: GetMemberInfoResponseCreditScore.Fair
                    },
                    {
                        name: this.ls.l('Score_Bad'),
                        value: GetMemberInfoResponseCreditScore.Poor
                    },
                    {
                        name: this.ls.l('Score_NoScore'),
                        value: GetMemberInfoResponseCreditScore.NotSure
                    }
                ]),
                selected$: this.creditScore$.pipe(map((creditScore: GetMemberInfoResponseCreditScore) => {
                    return this.filtersValues.creditScore && this.offersService.convertNumberToCreditScore(this.filtersValues.creditScore) || creditScore;
                })),
                onChange: (e: MatSelectChange) => {
                    const filterValue: number = <any>this.offersService.convertCreditScoreToNumber(e.value);
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
                valueDisplayFunction: (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '0.0-0'),
                onChange: (e: MatSliderChange) => {
                    if (this.filtersValues.annualIncome != e.value) {
                        this.filtersValues.annualIncome = e.value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
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
            //     selected$: this.creditScore$.pipe(map((creditScore: GetMemberInfoResponseCreditScore) => {
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
                selected$: this.offersService.state$,
                values$: this.store$.pipe(
                    select(StatesStoreSelectors.getState, { countryCode: 'US' }),
                    filter(states => states && states.length),
                    map(states => [ { name: 'All USA', value: 'all' } ].concat(states.map(state => ({ name: state.name, value: state.code }))))
                ),
                onChange: (e: MatSelectChange) => {
                    const value = e.value.name ? e.value.value : e.value;
                    if (this.filtersValues.state != value) {
                        this.filtersValues.state = value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            })
        ],
        [CategoryGroupEnum.CreditCards]: [
            new ScoreFilterSetting({
                name: this.ls.l('Offers_Filter_CreditScore'),
                values$: of([
                    {
                        name: 'Excellent',
                        value: GetMemberInfoResponseCreditScore.Excellent,
                        min: 720,
                        max: 850
                    },
                    {
                        name: 'Good',
                        value: GetMemberInfoResponseCreditScore.Good,
                        min: 690,
                        max: 719
                    },
                    {
                        name: 'Fair',
                        value: GetMemberInfoResponseCreditScore.Fair,
                        min: 630,
                        max: 689
                    },
                    {
                        name: 'Bad',
                        value: GetMemberInfoResponseCreditScore.Poor,
                        min: 300,
                        max: 629
                    },
                    {
                        name: 'Limited or No Score',
                        value: GetMemberInfoResponseCreditScore.NotSure
                    }
                ]),
                selected$: this.creditScore$.pipe(map((creditScore: GetMemberInfoResponseCreditScore) => {
                    return this.filtersValues.creditScore && this.offersService.convertNumberToCreditScore(this.filtersValues.creditScore) || creditScore;
                })),
                onChange: (creditScore: CreditScoreItem) => {
                    const filterValue: number = <any>this.offersService.convertCreditScoreToNumber(creditScore.value);
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
                    {
                        name: this.ls.l('Offers_Credit'),
                        value: CreditCardCategory.Credit
                    },
                    {
                        name: this.ls.l('Offers_Debit'),
                        value: CreditCardCategory.Debit
                    },
                    {
                        name: this.ls.l('Offers_Prepaid'),
                        value: CreditCardCategory.Prepaid
                    }
                ]),
                onChange: (selectedValues: ChooserOption[]) => {
                    let cardType, securingType;
                    if (selectedValues[0]) {
                        switch (selectedValues[0].value) {
                            case CreditCardCategory.Credit:
                                cardType = GetAllInputCardType.Credit;
                                break;
                            case CreditCardCategory.Debit:
                                cardType = GetAllInputCardType.Debit;
                                break;
                            case CreditCardCategory.Prepaid:
                                securingType = GetAllInputSecuringType.Prepaid;
                                break;
                        }
                    }
                    if (this.filtersValues.cardType !== cardType || this.filtersValues.securingType != securingType) {
                        this.filtersValues.cardType = cardType;
                        this.filtersValues.securingType = securingType;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new ChooserFilterSetting({
                name: this.ls.l('Offers_Filter_Type'),
                chooserDesign: ChooserDesign.Combined,
                chooserType: ChooserType.Single,
                values$: of([
                    {
                        name: this.ls.l('Offers_Personal'),
                        value: GetAllInputTargetAudience.Consumer
                    },
                    {
                        name: this.ls.l('Offers_Student'),
                        value: GetAllInputTargetAudience.Students,
                    },
                    {
                        name: this.ls.l('Offers_Business'),
                        value: GetAllInputTargetAudience.Business
                    }
                ]),
                onChange: (selectedValues: ChooserOption[]) => {
                    let targetAudience = selectedValues[0] && selectedValues[0].value;
                    if (this.filtersValues.targetAudience !== targetAudience) {
                        this.filtersValues.targetAudience = targetAudience;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Rating'),
                values$: of(['All', '5', '4', '3', '2', '1'].map(value => ({ name: value, value: value.toLowerCase() }))),
                selected$: of('all'),
                templateName: 'rating',
                onChange: (e: MatSelectChange) => {
                    if (e.value != this.filtersValues.overallRating) {
                        this.filtersValues.overallRating = e.value === 'all' ? undefined : e.value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new SelectFilterSetting({
                name: this.ls.l('Offers_Filter_Brand'),
                values$: this.brands$,
                selected$: of('all'),
                onChange: (e: MatSelectChange) => {
                    if (e.value != this.filtersValues.issuingBank) {
                        this.filtersValues.issuingBank = e.value === 'all' ? undefined : e.value;
                        this.selectedFilter.next(this.filtersValues);
                    }
                }
            }),
            new ChooserFilterSetting({
                name: this.ls.l('Offers_Filter_Network'),
                chooserType: ChooserType.Multi,
                chooserDesign: ChooserDesign.Separate,
                values$: of([
                    {
                        iconSrc: './assets/common/icons/offers/visa.svg',
                        value: CardNetworks.Visa,
                    },
                    {
                        iconSrc: './assets/common/icons/offers/mastercard.svg',
                        value: CardNetworks.Mastercard
                    },
                    {
                        iconSrc: './assets/common/icons/offers/discover.svg',
                        value: CardNetworks.Discover
                    },
                    {
                        iconSrc: './assets/common/icons/offers/american-express.svg',
                        value: CardNetworks.AmEx
                    }
                ]),
                onChange: (selectedValues: ChooserOption[]) => {
                    let networks = selectedValues.map(value => value.value);
                    this.filtersValues.cardNetworks = networks;
                    this.selectedFilter.next(this.filtersValues);
                }
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

    buttonCaption = 'Apply';
    pagePrefix: any;

    constructor(
        injector: Injector,
        applicationRef: ApplicationRef,
        public ls: AppLocalizationService,
        private dialog: MatDialog,
        private router: Router,
        private offersService: OffersService,
        private renderer: Renderer2,
        private route: ActivatedRoute,
        private offerServiceProxy: OfferServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private store$: Store<RootStore.State>,
        private currencyPipe: CurrencyPipe,
        private numberAbbrPipe: NumberAbbrPipe,
        private _sessionService: AppSessionService,
        @Inject(DOCUMENT) private document
    ) {}

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
                case OfferFilterCategory.PersonalLoans:
                    this.buttonCaption = 'GetMyRate';
                    break;
                case OfferFilterCategory.CreditCards:
                    this.buttonCaption = 'ViewOffers';
                    break;
                case OfferFilterCategory.CreditScore:
                    this.buttonCaption = 'GetOffer';
                    break;
            }
        });
        this.selectedFilter$ = combineLatest(this.creditScore$, this.category$, this.offersService.state$)
            .pipe(
                first(),
                switchMap(([creditScore, category, state]) => {
                    this.filtersValues.creditScore = creditScore;
                    this.filtersValues.category = category;
                    this.filtersValues.state = state;
                    this.selectedFilter.next(this.filtersValues);
                    return this.selectedFilter.asObservable();
                })
            );

        this.activate();
    }

    ngAfterViewInit() {
        setTimeout(() => this.filterScroll.instance.update());
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
                ([filter, memberInfo]: [FilterValues, GetMemberInfoResponse]) => {
                    const categoryGroup = this.offersService.getCategoryGroup(filter.category);
                    let input = GetAllInput.fromJS({
                        testMode: memberInfo.testMode,
                        isDirectPostSupported: memberInfo.isDirectPostSupported,
                        category: filter.category,
                        country: filter.country
                    });

                    if (categoryGroup === CategoryGroupEnum.Loans) {
                        input.loanAmount = filter.loanAmount;
                        input.annualIncome = filter.annualIncome;
                        input.state = filter.state ?
                            (filter.state == 'all' ? undefined : filter.state) :
                                memberInfo.stateCode;
                    }

                    if (categoryGroup === CategoryGroupEnum.CreditCards) {
                        input.cardNetworks = filter.cardNetworks;
                        input.cardType = filter.cardType;
                        input.securingType = filter.securingType;
                        input.targetAudience = filter.targetAudience;
                        input.overallRating = filter.overallRating;
                        input.issuingBank = filter.issuingBank;
                    }

                    if (categoryGroup === CategoryGroupEnum.Loans || categoryGroup === CategoryGroupEnum.CreditCards)
                        input.creditScore = GetAllInputCreditScore[this.offersService.getCreditScore(filter.category, filter.creditScore)];

                    return (
                        this._sessionService.isLendspaceDemoUser && input.creditScore == GetAllInputCreditScore.Excellent 
                            ? of(this.offersService.demoUserOffers) : this.offerServiceProxy.getAll(input)
                    ).pipe(
                        finalize(() => {
                            this.offersAreLoading = false;
                            abp.ui.clearBusy(this.offersListRef.nativeElement);
                            this.changeDetectorRef.detectChanges();
                            this.document.body.scrollTo(0, 0);
                        })
                    );
                }
            ),
            tap(offers => {
                this.offersCount = offers.length;
                this.changeDetectorRef.detectChanges();
            }),
            publishReplay(),
            refCount()
        );
        this.getBrandsFromOffers(this.offers$).subscribe(
            (brands: SelectFilterModel[]) => this.brands$.next(brands)
        );
        this.displayedOffers$ = this.offers$;
        this.displayedOffers$.pipe(takeUntil(this.deactivate$)).subscribe((displayedCreditCards: OfferDto[]) => {
            this.offersService.displayedCards = displayedCreditCards;
        });
    }

    private getBrandsFromOffers(offers: Observable<OfferDto[]>): Observable<SelectFilterModel[]> {
        return offers.pipe(
            first(),
            mergeMap(x => x),
            pluck('issuingBank'),
            filter(brand => !!brand),
            distinct(),
            map(brand => <SelectFilterModel>({ name: brand, value: brand })),
            toArray(),
            map(brands => [{ name: 'All', value: 'all' }].concat(brands.sort((brandA, brandB) => brandA.name > brandB.name ? 1 : -1 )))
        );
    }

    private getDefaultFilters() {
        return {
            category: undefined,
            country: 'US',
            creditScore: null,
            issuingBank: undefined,
            cardNetworks: [],
            cardType: undefined,
            securingType: undefined,
            targetAudience: undefined,
            state: undefined,
            loanAmount: 10000,
            overallRating: undefined,
            annualIncome: 55000
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

    checkDemoUserActionAllowed(card: OfferDto, redirect = false) {
        if (this._sessionService.isLendspaceDemoUser) {
            let result = this.filtersValues.creditScore < 720;
            if (!result && card && card.redirectUrl)
                redirect ? window.open(card.redirectUrl) :
                    this.dialog.open(MarcusDetailsComponent, {
                        width: '900px',
                        height: '800px'
                    });

            return result;
        } else
            return true;
    }

    viewCardDetails(card: OfferDto) {
        if (this.checkDemoUserActionAllowed(card))
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
        if (this.checkDemoUserActionAllowed(offer, true))
            this.category$.pipe(first()).subscribe(
                category => this.offersService.applyOffer(offer, category === OfferFilterCategory.CreditCards)
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
        this.visibleOffersCount += this.defaultVisibleOffersCount;
    }

    getFilterScrollHeight() {
        return this.hideFilters ? 0 : window.innerHeight - 155;
    }
}

/** Core imports */
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    Injector,
    OnDestroy,
    OnInit
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { Observable, Subject, combineLatest } from 'rxjs';
import { finalize, map, tap, publishReplay, startWith, switchMap, refCount, withLatestFrom } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { startCase } from 'lodash';

/** Application imports */
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from 'shared/service-proxies/service-proxies';
import { RootComponent } from 'root.components';
import {
    CountryStateDto,
    CreditScores2,
    ExtendOfferDto,
    OfferDetailsForEditDtoCampaignProviderType,
    OfferDetailsForEditDtoCardNetwork,
    OfferDetailsForEditDtoCardType,
    OfferDetailsForEditDtoOfferCollection,
    OfferDetailsForEditDtoParameterHandlerType,
    OfferDetailsForEditDtoSecuringType,
    OfferDetailsForEditDtoStatus, OfferDetailsForEditDtoSystemType,
    OfferDetailsForEditDtoTargetAudience,
    OfferDetailsForEditDtoType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FieldPositionEnum } from '@app/pfm/offer-edit/field-position.enum';
import { FieldType } from '@app/pfm/offer-edit/field-type.enum';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: [ '../../shared/form.less', './offer-edit.component.less' ],
    providers: [ OfferManagementServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit, OnDestroy {
    allDetails$: Observable<string[]>;
    filteredBySectionDetails$: Observable<string[]>;
    detailsFieldsByPosition = {
        [FieldPositionEnum.Left]: [],
        [FieldPositionEnum.Right]: [],
        [FieldPositionEnum.Center]: []
    };
    startCase = startCase;
    rootComponent: RootComponent;
    navLinks = [
        {
            label: 'General',
            route: '../general'
        },
        {
            label: 'Rating',
            route: '../rating'
        },
        {
            label: 'Attributes',
            route: '../attributes'
        }
    ];
    fieldPositions = FieldPositionEnum;
    offerId$: Observable<number> = this.route.paramMap.pipe(map((paramMap: ParamMap) => +paramMap.get('id')));
    private _refresh: Subject<null> = new Subject<null>();
    refresh: Observable<null> = this._refresh.asObservable();
    offerDetails$: Observable<OfferDetailsForEditDto> = this.refresh.pipe(
        startWith(this.offerId$),
        tap(() => abp.ui.setBusy()),
        withLatestFrom(this.offerId$),
        switchMap(([, offerId])  => this.offerManagementService.getDetailsForEdit(offerId).pipe(
            finalize(() => abp.ui.clearBusy())
        )),
        publishReplay(),
        refCount()
    );
    states$: Observable<CountryStateDto[]> = this.offerDetails$.pipe(
        map(offerDetails => offerDetails.countries[0]),
        tap(countryCode => this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode))),
        switchMap(countryCode => this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode})))
    );
    detailsConfig = {
        logoUrl: {
            hidden: true
        },
        customName: {
            hidden: true
        },
        parameterHandlerType: {
            hidden: true,
            enum: OfferDetailsForEditDtoParameterHandlerType
        },
        campaignId: {
            readOnly: true
        },
        name: {
            readOnly: true
        },
        description: {
            readOnly: true
        },
        categories: {
            readOnly: true
        },
        status: {
            readOnly: true,
            enum: OfferDetailsForEditDtoStatus
        },
        systemType: {
            readOnly: true,
            enum: OfferDetailsForEditDtoSystemType
        },
        type: {
            readOnly: true,
            enum: OfferDetailsForEditDtoType
        },
        campaignUrl: {
            readOnly: true,
            position: FieldPositionEnum.Center,
            cssClass: 'center'
        },
        cardNetwork: {
            readOnly: true,
            enum: OfferDetailsForEditDtoCardNetwork
        },
        cartType: {
            readOnly: true
        },
        targetAudience: {
            readOnly: true,
            enum: OfferDetailsForEditDtoTargetAudience
        },
        securingType: {
            readOnly: true,
            enum: OfferDetailsForEditDtoSecuringType
        },
        issuingBank: {
            readOnly: true
        },
        creditScores: {
            readOnly: true,
            enum: CreditScores2,
            multiple: true,
            position: FieldPositionEnum.Left
        },
        minAnnualIncome: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency,
            label: 'Annual Income'
        },
        maxAnnualIncome: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency,
            hidden: true
        },
        minLoanAmount: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency,
            label: 'Loan Amount'
        },
        maxLoanAmount: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency,
            hidden: true
        },
        minLoanTermMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number,
            label: 'Loan Term Months'
        },
        maxLoanTermMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number,
            hidden: true
        },
        introAPR: {
            position: FieldPositionEnum.Left
        },
        regularAPR: {
            position: FieldPositionEnum.Left
        },
        introRewardsBonus: {
            position: FieldPositionEnum.Left
        },
        rewardsRate: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number
        },
        annualFee: {
            position: FieldPositionEnum.Left
        },
        monthlyFee: {
            position: FieldPositionEnum.Left
        },
        balanceTransferFee: {
            position: FieldPositionEnum.Left
        },
        activationFee: {
            position: FieldPositionEnum.Left
        },
        zeroPercentageInterestTransfers: {
            position: FieldPositionEnum.Left
        },
        durationForZeroPercentageTransfersInMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number,
            groupLabel: 'Duration For Zero Percentage (Months)',
            label: 'Transfers',
            cssClass: 'groupItem'
        },
        durationForZeroPercentagePurchasesInMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number,
            label: 'Purchases',
            cssClass: 'groupItem'
        },
        offerCollection: {
            enum: OfferDetailsForEditDtoOfferCollection,
            position: FieldPositionEnum.Right
        },
        flags: {
            position: FieldPositionEnum.Right
        },
        overallRating: {
            type: FieldType.Rating
        },
        interestRating: {
            type: FieldType.Rating
        },
        feesRating: {
            type: FieldType.Rating
        },
        benefitsRating: {
            type: FieldType.Rating
        },
        rewardsRating: {
            type: FieldType.Rating
        },
        serviceRating: {
            type: FieldType.Rating
        },
        cardType: {
            enum: OfferDetailsForEditDtoCardType
        },
        campaignProviderType: {
            enum: OfferDetailsForEditDtoCampaignProviderType
        },
        states: {
            position: FieldPositionEnum.Left,
            multiple: true,
            dataSourceConfig: {
                source: this.states$,
                async: true,
                displayExpr: 'name',
                valueExpr: 'code'
            }
        },
        pros: {
            cssClass: 'valuesBelow'
        },
        cons: {
            cssClass: 'valuesBelow'
        },
        details: {
            cssClass: 'valuesBelow'
        },
        countries: {
            readOnly: true
        },
        daysOfWeekAvailability: {
                readOnly: true
        },
        effectiveTimeOfDay: {
            readOnly: true
        },
        expireTimeOfDay: {
            readOnly: true
        },
        termsOfService: {
            readOnly: true
        },
        traficSource: {
            readOnly: true
        },
        isPublished: {
            cssClass: 'leftAlignment'
        }
    };
    model: OfferDetailsForEditDto;
    section$: Observable<string>;
    sectionsDetails = {
        'general': [
            'campaignId',
            'name',
            'isPublished',
            'status',
            'categories',
            'description',
            'subId',
            'systemType',
            'type',
            'campaignProviderType',
            'cardNetwork',
            'cartType',
            'targetAudience',
            'securingType',
            'issuingBank',
            'countries',
            'daysOfWeekAvailability',
            'effectiveTimeOfDay',
            'expireTimeOfDay',
            'termsOfService',
            'traficSource',
            'pros',
            'details',
            'cons',
            'campaignUrl'
        ],
        'rating': [
            'overallRating',
            'interestRating',
            'feesRating',
            'benefitsRating',
            'rewardsRating',
            'serviceRating'
        ],
        'attributes': [
            'states',
            'creditScores',
            'minAnnualIncome',
            'maxAnnualIncome',
            'minLoanAmount',
            'maxLoanAmount',
            'minLoanTermMonths',
            'maxLoanTermMonths',
            'loanAmount',
            'loanTermMonths',
            'introAPR',
            'regularAPR',
            'introRewardsBonus',
            'rewardsRate',
            'annualFee',
            'monthlyFee',
            'balanceTransferFee',
            'activationFee',
            'zeroPercentageInterestTransfers',
            'durationForZeroPercentageTransfersInMonths',
            'durationForZeroPercentagePurchasesInMonths',
            'offerCollection',
            'flags'
        ]
    };
    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private offerManagementService: OfferManagementServiceProxy,
        private applicationRef: ApplicationRef,
        private router: Router,
        public ls: AppLocalizationService,
        private store$: Store<RootStore.State>
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.section$ = this.route.paramMap.pipe(map((paramMap: ParamMap) => paramMap.get('section') || 'general'));
        this.rootComponent.overflowHidden(true);
        this.offerDetails$.subscribe(details => {
            this.model = details;
        });
        this.allDetails$ = this.offerDetails$.pipe(map((details: OfferDetailsForEditDto) => Object.keys(details)));
        this.filteredBySectionDetails$ = combineLatest(
            this.allDetails$,
            this.section$
        ).pipe(
            map(([details, section]: [string[], string]) => {
                return details
                        .filter(detail => this.sectionsDetails[section].indexOf(detail) >= 0 )
                        .sort((detailA, detailB) => this.sectionsDetails[section].indexOf(detailA) > this.sectionsDetails[section].indexOf(detailB) ? 1 : -1);
            })
        );
        this.filteredBySectionDetails$.subscribe(details => {
            this.resetDetailsPositionsArrays();
            details.forEach((detail, index) => {
                const detailSideArray = this.detailsConfig[detail] && this.detailsConfig[detail].position
                    ? this.detailsFieldsByPosition[this.detailsConfig[detail].position]
                    : index % 2 === 0 ? this.detailsFieldsByPosition[FieldPositionEnum.Left] : this.detailsFieldsByPosition[FieldPositionEnum.Right];
                detailSideArray.push(detail);
            });
        });
    }

    private resetDetailsPositionsArrays() {
        for (let prop in this.detailsFieldsByPosition) {
            if (this.detailsFieldsByPosition.hasOwnProperty(prop)) {
                this.detailsFieldsByPosition[prop] = [];
            }
        }
    }

    refreshData() {
        this._refresh.next();
    }

    detailHasMaxValue(detailName: string): boolean {
        return detailName.indexOf('min') === 0;
    }

    isCurrencyType(detailName: string): boolean {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].type === FieldType.Currency;
    }

    isNumberType(detailName: string): boolean {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].type === FieldType.Number || this.isCurrencyType(detailName);
    }

    keys(obj: Object): string[] {
        return Object.keys(obj);
    }

    isPrimitive(item: any): boolean {
        return item !== Object(item);
    }

    isBool(value: any): boolean {
        return value === 'true' || value === 'false' || typeof value === 'boolean';
    }

    isObject(item: any): boolean {
        return item === Object(item);
    }

    isEnum(detailName: string): boolean {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].enum;
    }

    isMultiple(detailName: string): boolean {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].multiple;
    }

    isRatingDetail(detailName: string): boolean {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].type === FieldType.Rating;
    }

    isArray(item: any): boolean {
        return Array.isArray(item);
    }

    addNew(model: any[]) {
        model.push('');
    }

    remove(item: any[], i: number) {
        item.splice(i, 1);
    }

    getKeys(object: Object) {
        return Object.keys(object);
    }

    back() {
        this.router.navigate(['../../'], { relativeTo: this.route });
    }

    onSubmit() {
        this.offerManagementService.extend(ExtendOfferDto.fromJS(this.model))
            .pipe(finalize(() => abp.ui.clearBusy()))
            .subscribe();
    }

    getInplaceEditData() {
        return {
            value: this.model && (this.model.customName || this.model.name)
        };
    }

    getDetailDisplayValue(detailName: string): string {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].label || startCase(detailName);
    }

    getDetailGroupLabel(detailName: string): string {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].groupLabel;
    }

    getInplaceWidth(name: string): string {
        return ((name.length + 1) * 12) + 'px';
    }

    updateCustomName(value: string) {
        this.model['customName'] = value;
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    getEnumDataSource(enumObject: any) {
        return [ { name: 'None', value: null } ].concat(
            Object.keys(enumObject).map(
                value => ({
                    name: value,
                    value: value
                })
            )
        );
    }

    isReadOnly(detail: string): boolean {
        return this.detailsConfig[detail] && this.detailsConfig[detail].readOnly;
    }

}

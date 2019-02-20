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
import { Observable, combineLatest } from 'rxjs';
import { finalize, map, tap, publishReplay, switchMap, refCount } from 'rxjs/operators';
import { cloneDeep, startCase } from 'lodash';
import { diff } from 'deep-diff';

/** Application imports */
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from 'shared/service-proxies/service-proxies';
import { RootComponent } from 'root.components';
import {
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

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: [ '../../shared/form.less', './offer-edit.component.less' ],
    providers: [ OfferManagementServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit, OnDestroy {
    offerDetails$: Observable<OfferDetailsForEditDto>;
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
        redirectUrl: {
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
            type: FieldType.Currency
        },
        maxAnnualIncome: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency
        },
        minLoanAmount: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency
        },
        maxLoanAmount: {
            position: FieldPositionEnum.Left,
            type: FieldType.Currency
        },
        minLoanTermMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number
        },
        maxLoanTermMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number
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
            type: FieldType.Number
        },
        durationForZeroPercentagePurchasesInMonths: {
            position: FieldPositionEnum.Left,
            type: FieldType.Number
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
            position: FieldPositionEnum.Left
        },
        pros: {
            cssClass: 'valuesBelow'
        },
        cons: {
            cssClass: 'valuesBelow'
        },
        details: {
            cssClass: 'valuesBelow'
        }
    };
    initialModel: OfferDetailsForEditDto;
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
            'pros',
            'cons',
            'details',
            'campaignUrl',
            'redirectUrl',
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
        public ls: AppLocalizationService
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.section$ = this.route.paramMap.pipe(map((paramMap: ParamMap) => paramMap.get('section') || 'general'));
        this.rootComponent.overflowHidden(true);
        this.offerDetails$ = this.route.paramMap.pipe(
            tap(() => abp.ui.setBusy()),
            map((paramMap: ParamMap) => +paramMap.get('id')),
            switchMap(offerId => this.offerManagementService.getDetailsForEdit(false, offerId).pipe(
                finalize(() => abp.ui.clearBusy())
            )),
            publishReplay(),
            refCount()
        );
        this.offerDetails$.subscribe(details => {
            this.model = details;
            this.initialModel = cloneDeep(this.model);
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

    addNew(model: any[], value: any) {
        model.push(value);
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
        const differences = diff(this.initialModel, this.model);
        let changed = {};
        if (differences) {
            abp.ui.setBusy();
            for (let diff of differences) {
                changed[diff.path[0]] = this.model[diff.path[0]];
            }
            this.offerManagementService.extend(ExtendOfferDto.fromJS(changed))
                .pipe(finalize(() => abp.ui.clearBusy()))
                .subscribe();
        }
    }

    getInplaceEditData() {
        return {
            value: this.model && (this.model.customName || this.model.name)
        };
    }

    updateCustomName(value: string) {
        this.model['customName'] = value;
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    onTextBoxChange(e, detailName: string) {
        /** Change redirect url if subId has changed */
        if (detailName === 'subId' && this.model.redirectUrl) {
            this.model.redirectUrl = this.model.redirectUrl.replace(/&subid=.*(&|$)/g, '&subid=' + e.value);
        }
    }

    isReadOnly(detail: string): boolean {
        return this.detailsConfig[detail] && this.detailsConfig[detail].readOnly;
    }

}

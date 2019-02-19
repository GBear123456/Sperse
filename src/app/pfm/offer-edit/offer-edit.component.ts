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
import { finalize, map, publishReplay, switchMap, refCount } from 'rxjs/operators';
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
    startCase = startCase;
    rootComponent: RootComponent;
    /** @todo replace in future */
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
    detailsToHide = [
        'logoUrl',
        'customName',
        'parameterHandlerType'
    ];
    readonlyDetails = [
        'campaignId',
        'name',
        'description',
        'category',
        'status',
        'systemType',
        'type',
        'campaignUrl',
        'redirectUrl',
        'cardNetwork',
        'cartType',
        'targetAudience',
        'securingType',
        'issuingBank'
    ];
    ratingDetails = [
        'overallRating',
        'interestRating',
        'feesRating',
        'benefitsRating',
        'rewardsRating',
        'serviceRating'
    ];
    detailsEnums = {
        creditScores: CreditScores2,
        cardNetwork: OfferDetailsForEditDtoCardNetwork,
        cardType: OfferDetailsForEditDtoCardType,
        targetAudience: OfferDetailsForEditDtoTargetAudience,
        securingType: OfferDetailsForEditDtoSecuringType,
        systemType: OfferDetailsForEditDtoSystemType,
        offerCollection: OfferDetailsForEditDtoOfferCollection,
        campaignProviderType: OfferDetailsForEditDtoCampaignProviderType,
        parameterHandlerType: OfferDetailsForEditDtoParameterHandlerType,
        status: OfferDetailsForEditDtoStatus,
        type: OfferDetailsForEditDtoType
    };
    detailsWithMultipleValues = {
        creditScores: 1
    };
    initialModel: OfferDetailsForEditDto;
    model: OfferDetailsForEditDto;
    section$: Observable<string>;
    sectionsDetails = {
        'general': [
            'campaignId',
            'name',
            'description',
            'category',
            'status',
            'isPublished',
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
    detailColumnClasses = {
        'campaignUrl': 'col-md-12',
        'redirectUrl': 'col-md-12'
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
            map((paramMap: ParamMap) => +paramMap.get('id')),
            switchMap(offerId => this.offerManagementService.getDetailsForEdit(false, offerId)),
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
        return this.detailsEnums[detailName];
    }

    isMultiple(detailName: string): boolean {
        return this.detailsWithMultipleValues[detailName];
    }

    isRatingDetail(detailName: string): boolean {
        return this.ratingDetails.indexOf(detailName) >= 0;
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

    getColumnClass(detail: string) {
        return this.detailColumnClasses[detail] || 'col-md-5';
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
        return this.readonlyDetails.indexOf(detail) >= 0;
    }

}

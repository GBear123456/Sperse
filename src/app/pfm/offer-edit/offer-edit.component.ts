/** Core imports */
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit,
    HostListener
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { BehaviorSubject, Observable, Subject, combineLatest, of, merge } from 'rxjs';
import {
    debounceTime,
    first,
    filter,
    finalize,
    map,
    tap,
    publishReplay,
    pluck,
    switchMap,
    refCount,
    withLatestFrom,
    distinctUntilChanged
} from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import startCase from 'lodash/startCase';
import cloneDeep from 'lodash/cloneDeep';
import swal from 'sweetalert';

/** Application imports */
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from 'shared/service-proxies/service-proxies';
import { RootComponent } from 'root.components';
import {
    CountryStateDto,
    CreditScores2,
    ExtendOfferDtoCampaignProviderType,
    ExtendOfferDtoCardNetwork,
    ExtendOfferDtoCardType,
    ExtendOfferDtoOfferCollection,
    ExtendOfferDtoParameterHandlerType,
    ExtendOfferDtoSecuringType,
    OfferDetailsForEditDtoStatus,
    OfferDetailsForEditDtoSystemType,
    ExtendOfferDtoTargetAudience,
    OfferDetailsForEditDtoType,
    OfferFilterCategory,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FieldPositionEnum } from '@app/pfm/offer-edit/field-position.enum';
import { FieldType } from '@app/pfm/offer-edit/field-type.enum';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';
import { CloseComponentAction } from '@app/shared/common/close-component.service/close-component-action.enum';
import { ICloseComponent } from '@app/shared/common/close-component.service/close-component.interface';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppConsts } from '@shared/AppConsts';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: [ '../../shared/form.less', './offer-edit.component.less' ],
    providers: [ CurrencyPipe, OfferManagementServiceProxy, OffersService, OfferServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit, OnDestroy, ICloseComponent {
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
        },
        {
            label: 'Credit Card Flags',
            route: '../flags'
        }
    ];
    fieldPositions = FieldPositionEnum;
    sentAnnouncementPermissionGranted: boolean;
    offerId$: Observable<number> = this.route.paramMap.pipe(
        map((paramMap: ParamMap) => +paramMap.get('id')),
        distinctUntilChanged()
    );
    private _refresh: Subject<null> = new Subject<null>();
    refresh: Observable<null> = this._refresh.asObservable();
    offerDetails$: Observable<OfferDetailsForEditDto> = merge(
        this.refresh,
        this.offerId$
    ).pipe(
        withLatestFrom(this.offerId$),
        tap(() => abp.ui.setBusy()),
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
    offerNotInCardCategory$ = this.offerDetails$.pipe(
        pluck('categories'),
        map((categories: any[]) => categories.map(item => item.category).indexOf(OfferFilterCategory.CreditCards) === -1)
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
            enum: ExtendOfferDtoParameterHandlerType
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
            enum: ExtendOfferDtoCardNetwork
        },
        cartType: {
            readOnly: true
        },
        targetAudience: {
            readOnly: true,
            enum: ExtendOfferDtoTargetAudience
        },
        securingType: {
            enum: ExtendOfferDtoSecuringType
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
            enum: ExtendOfferDtoOfferCollection,
            position: FieldPositionEnum.Left,
            readOnly$: this.offerNotInCardCategory$
        },
        flags: {
            position: FieldPositionEnum.Center,
            readOnly$: this.offerNotInCardCategory$
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
            enum: ExtendOfferDtoCardType
        },
        campaignProviderType: {
            enum: ExtendOfferDtoCampaignProviderType
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
    initialModel: OfferDetailsForEditDto;
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
            'countries',
            'daysOfWeekAvailability',
            'effectiveTimeOfDay',
            'expireTimeOfDay',
            'asfdasdf',
            'termsOfService',
            'traficSource',
            'pros',
            'details',
            'cons',
            'campaignUrl',
            'issuingBank'
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
            'durationForZeroPercentagePurchasesInMonths'
        ],
        'flags': [
            'offerCollection',
            'flags'
        ]
    };
    offerIsUpdating = false;
    private targetEntity: BehaviorSubject<TargetDirectionEnum> = new BehaviorSubject<TargetDirectionEnum>(TargetDirectionEnum.Current);
    public targetEntity$: Observable<TargetDirectionEnum> = this.targetEntity.asObservable();
    prevButtonIsDisabled = true;
    nextButtonIsDisabled = true;
    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private offerManagementService: OfferManagementServiceProxy,
        private applicationRef: ApplicationRef,
        private router: Router,
        public ls: AppLocalizationService,
        private store$: Store<RootStore.State>,
        private notifyService: NotifyService,
        private changeDetector: ChangeDetectorRef,
        private itemDetailsService: ItemDetailsService,
        private permissionChecker: PermissionCheckerService,
        private offersService: OffersService
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
        this.sentAnnouncementPermissionGranted = this.permissionChecker.isGranted('Pages.PFM.Applications.SendOfferAnnouncements');
    }

    ngOnInit() {
        this.section$ = this.route.paramMap.pipe(map((paramMap: ParamMap) => paramMap.get('section') || 'general'));
        this.rootComponent.overflowHidden(true);
        this.offerDetails$.subscribe(details => {
            this.model = details;
            this.updateInitialModel();
        });
        this.allDetails$ = this.offerDetails$.pipe(map((details: OfferDetailsForEditDto) => {
            let res = [];
            for (let detail in details) {
                if (detail === 'extendedInfo') {
                    res = res.concat(this.keys(details.extendedInfo));
                } else {
                    res.push(detail);
                }
            }
            return res;
        }));
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
        this.targetEntity$.pipe(
            debounceTime(300),
            withLatestFrom(this.offerId$),
            switchMap(([direction, offerId]: [number, TargetDirectionEnum]) => {
                return this.itemDetailsService.getItemFullInfo(ItemTypeEnum.Offer, offerId, direction, 'CampaignId');
            }),
            withLatestFrom(this.offerId$, this.section$),
            filter(itemFullInfo => !!itemFullInfo)
        ).subscribe(([itemFullInfo, offerId, section]: [ItemFullInfo, number, string]) => {
            if (itemFullInfo) {
                if (offerId !== itemFullInfo.itemData.CampaignId) {
                    this.router.navigate(
                        ['../..', itemFullInfo.itemData.CampaignId, section],
                        { relativeTo: this.route }
                    );
                }
                this.nextButtonIsDisabled = itemFullInfo && itemFullInfo.isLastOnList;
                this.prevButtonIsDisabled = itemFullInfo && itemFullInfo.isFirstOnList;
            }
        });
    }

    @HostListener('window:beforeunload', ['$event']) beforeUnload($event) {
        if (this.dataChanged()) {
            $event.returnValue = this.ls.l('UnsavedChanges');
            return $event.returnValue;
        }
    }

    handleDeactivate(deactivateAction: CloseComponentAction): Observable<boolean> {
        let deactivate$: Observable<boolean> = of(true);
        switch (deactivateAction) {
            case CloseComponentAction.Save: {
                deactivate$ = this.onSubmit().pipe(map(() => true));
                break;
            }
            case CloseComponentAction.Discard: {
                this.model = cloneDeep(this.initialModel);
                deactivate$ = of(true);
                break;
            }
            case CloseComponentAction.ContinueEditing: {
                deactivate$ = of(false);
                break;
            }
        }
        return deactivate$;
    }

    dataChanged(): boolean {
        return JSON.stringify(this.model) !== JSON.stringify(this.initialModel);
    }

    skipClosePopup(currentUrl: string, nextUrl: string): boolean {
        const currentUrlPath = currentUrl.split('/');
        const currentUrlLastPathItem = currentUrlPath.pop();
        const nextUrlPath = nextUrl ? nextUrl.split('/') : [];
        const nextUrlLastPathItem = nextUrlPath ? nextUrlPath.pop() : '';
        return currentUrlPath.join('/') === nextUrlPath.join('/') && currentUrlLastPathItem !== nextUrlLastPathItem;
    }

    onPrev() {
        this.targetEntity.next(TargetDirectionEnum.Prev);
    }

    onNext() {
        this.targetEntity.next(TargetDirectionEnum.Next);
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

    back() {
        this.router.navigate(['../../'], { relativeTo: this.route });
    }

    onSubmit(): Observable<void> {
        this.offerIsUpdating = true;
        abp.ui.setBusy();
        const submit$ = this.offerManagementService.extend(this.model.campaignId, this.model.extendedInfo)
            .pipe(
                finalize(() => {
                    abp.ui.clearBusy();
                    this.offerIsUpdating = false;
                    this.changeDetector.detectChanges();
                }),
                publishReplay(),
                refCount()
            );

        submit$.subscribe(
            () => {
                this.notifyService.info(this.ls.l('SavedSuccessfully', 'Platform'));
                this.updateInitialModel();
            },
            e => this.notifyService.error(e)
        );
        return submit$;
    }

    private updateInitialModel() {
        this.initialModel = cloneDeep(this.model);
    }

    getInplaceEditData() {
        return {
            value: this.model && (this.model.extendedInfo.customName || this.model.name)
        };
    }

    getDetailDisplayValue(detailName: string): string {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].label || startCase(detailName);
    }

    getDetailGroupLabel(detailName: string): string {
        return this.detailsConfig[detailName] && this.detailsConfig[detailName].groupLabel;
    }

    updateCustomName(value: string) {
        this.model.extendedInfo.customName = value;
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

    isReadOnly(detail: string): Observable<boolean> {
        let readOnly$ = of(false);
        if (this.detailsConfig[detail]) {
            readOnly$ = this.detailsConfig[detail].readOnly$ || of(this.detailsConfig[detail].readOnly);
        }
        return readOnly$;
    }

    onNotify() {
        if (this.sentAnnouncementPermissionGranted) {
            this.offerId$.pipe(first()).subscribe((offerId: number) => {
                const offerCategory = this.offersService.getCategoryRouteNameByCategoryEnum(this.model.categories[0].category as any);
                const offerPublicLink = AppConsts.appBaseUrl + 'personal-finance/offers/' + offerCategory + '/' + offerId;
                const el = document.createElement('div');
                el.innerHTML = `<h5>${this.ls.ls('PFM', 'OfferLinkWillBeSentToUsers')}:</h5>
                                <a href="${offerPublicLink}" target="_blank">${offerPublicLink}</a>`;
                const swalParams: any = {
                    title: '',
                    content: el,
                    buttons: {
                        confirm: {
                            text: this.ls.ls('PFM', 'Confirm'),
                            value: true,
                            visible: true
                        },
                        cancel: {
                            text: this.ls.ls('PFM', 'Cancel'),
                            value: false,
                            visible: true
                        }
                    }
                };
                swal(swalParams).then((confirmed) => {
                    if (confirmed) {
                        abp.ui.setBusy();
                        this.offerManagementService.sendAnnouncement(
                            offerId,
                            offerPublicLink
                        ).pipe(finalize(() => abp.ui.clearBusy()))
                            .subscribe(() => this.notifyService.success(this.ls.ls('PFM', 'AnnouncementsHaveBeenSent')));
                    }
                });
            });
        }
    }
}

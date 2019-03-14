/** Core imports */
import {
    ApplicationRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { debounceTime, filter, finalize, map, tap, publishReplay, pluck, switchMap, refCount, withLatestFrom } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from 'shared/service-proxies/service-proxies';
import { RootComponent } from 'root.components';
import {
    CountryStateDto,
    CreditScores2,
    ExtendOfferDtoCampaignProviderType,
    ExtendOfferDtoCardNetwork,
    ExtendOfferDtoCardType,
    ExtendOfferDtoOfferCollection, ExtendOfferDtoParameterHandlerType,
    ExtendOfferDtoSecuringType,
    ExtendOfferDtoTargetAudience,
    OfferDetailsForEditDtoStatus,
    OfferDetailsForEditDtoSystemType,
    OfferDetailsForEditDtoType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { NotifyService } from '@abp/notify/notify.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: [ '../../shared/form.less', './offer-edit.component.less' ],
    providers: [ OfferManagementServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit, OnDestroy {
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
    offerId$: Observable<number> = this.route.paramMap.pipe(map((paramMap: ParamMap) => +paramMap.get('id')));
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
        map(offerDetails => offerDetails.countries ? offerDetails.countries[0] : 'US'),
        tap(countryCode => this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode))),
        switchMap(countryCode => this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode})))
    );
    offerNotInCardCategory$ = this.offerDetails$.pipe(pluck('categories'), map((categories: any[]) => categories.indexOf('Credit Cards') === -1));
    statusEnum = OfferDetailsForEditDtoStatus;
    systemTypeEnum = OfferDetailsForEditDtoSystemType;
    typeEnum = OfferDetailsForEditDtoType;
    campaignProviderTypeEnum = ExtendOfferDtoCampaignProviderType;
    parameterHandlerTypeEnum = ExtendOfferDtoParameterHandlerType;
    cardTypeEnum = ExtendOfferDtoCardType;
    cardNetworkEnum = ExtendOfferDtoCardNetwork;
    targetAudienceEnum = ExtendOfferDtoTargetAudience;
    securingTypeEnum = ExtendOfferDtoSecuringType;
    creditScoresEnum = CreditScores2;
    offerCollectionEnum = ExtendOfferDtoOfferCollection;
    model: OfferDetailsForEditDto;
    section$: Observable<string>;
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
        private itemDetailsService: ItemDetailsService
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
    }

    ngOnInit() {
        this.section$ = this.route.paramMap.pipe(map((paramMap: ParamMap) => paramMap.get('section') || 'general'));
        this.rootComponent.overflowHidden(true);
        this.offerDetails$.subscribe(details => {
            this.model = details;
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
            if (offerId !== itemFullInfo.itemData.CampaignId) {
                this.router.navigate(
                    ['../..', itemFullInfo.itemData.CampaignId, section],
                    { relativeTo: this.route }
                );
            }
            this.nextButtonIsDisabled = itemFullInfo && itemFullInfo.isLastOnList;
            this.prevButtonIsDisabled = itemFullInfo && itemFullInfo.isFirstOnList;
        });
    }

    refreshData() {
        this._refresh.next();
    }

    keys(obj: Object): string[] {
        return Object.keys(obj);
    }

    onPrev() {
        this.targetEntity.next(TargetDirectionEnum.Prev);
    }

    onNext() {
        this.targetEntity.next(TargetDirectionEnum.Next);
    }

    back() {
        this.router.navigate(['../../'], { relativeTo: this.route });
    }

    onSubmit() {
        this.offerIsUpdating = true;
        abp.ui.setBusy();
        this.offerManagementService.extend(this.model.campaignId, this.model.extendedInfo)
            .pipe(finalize(() => {
                abp.ui.clearBusy();
                this.offerIsUpdating = false;
                this.changeDetector.detectChanges();
            }))
            .subscribe(
                () => this.notifyService.info(this.ls.l('SavedSuccessfully', 'Platform')),
                e => this.notifyService.error(e)
            );
    }

    getInplaceEditData() {
        return {
            value: this.model && (this.model.extendedInfo.customName || this.model.name)
        };
    }

    updateCustomName(value: string) {
        this.model.extendedInfo.customName = value;
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden(false);
    }

    getEnumDataSource(enumObject: any) {
        return [ { name: 'None', value: null } ].concat(
            this.keys(enumObject).map(
                value => ({
                    name: value,
                    value: value
                })
            )
        );
    }

}

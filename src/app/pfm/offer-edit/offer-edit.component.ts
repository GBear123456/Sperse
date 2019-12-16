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
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { BehaviorSubject, Observable, Subject, of, merge } from 'rxjs';
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
import cloneDeep from 'lodash/cloneDeep';
import range from 'lodash/range';
import * as moment from 'moment-timezone';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { RootComponent } from 'root.components';
import {
    CountryStateDto,
    CampaignProviderType,
    CardNetwork,
    CardType,
    OfferCollection,
    ParameterHandlerType,
    SecuringType,
    CampaignStatus,
    TargetAudience,
    CampaignType,
    OfferServiceProxy,
    OfferCategoryDto,
    OfferDetailsForEditDto,
    OfferManagementServiceProxy,
    OfferAnnouncementServiceProxy,
    CreditScoreRating
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';
import { ItemTypeEnum } from '@shared/common/item-details-layout/item-type.enum';
import { TargetDirectionEnum } from '@app/crm/contacts/target-direction.enum';
import { ItemFullInfo } from '@shared/common/item-details-layout/item-full-info';
import { CloseComponentAction } from '@app/shared/common/close-component.service/close-component-action.enum';
import { ICloseComponent } from '@app/shared/common/close-component.service/close-component.interface';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppConsts } from '@shared/AppConsts';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { OfferNotifyDialogComponent } from '@app/pfm/offer-edit/offer-notify-dialog/offer-notify-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: [ '../../shared/common/styles/form.less', './offer-edit.component.less' ],
    providers: [ CurrencyPipe, OfferAnnouncementServiceProxy, OfferManagementServiceProxy, OfferServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit, OnDestroy, ICloseComponent {
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
        },
        {
            label: 'Click Stats',
            route: '../stats'
        },
        {
            label: 'Visitors',
            route: '../visitors'
        }
    ];
    startedYear = 2018;
    selectedYear: number = moment().year();
    years: number[] = range(this.startedYear, this.selectedYear + 1);
    offerId$: Observable<number>;
    private _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    offerDetails$: Observable<OfferDetailsForEditDto>;
    states$: Observable<CountryStateDto[]>;
    categoriesNames$: Observable<string[]>;
    offerNotInCardCategory$: Observable<boolean>;
    statusEnum = CampaignStatus;
    typeEnum = CampaignType;
    campaignProviderTypeEnum = CampaignProviderType;
    parameterHandlerTypeEnum = ParameterHandlerType;
    cardTypeEnum = CardType;
    cardNetworkEnum = CardNetwork;
    targetAudienceEnum = TargetAudience;
    securingTypeEnum = SecuringType;
    offerCollectionEnum = OfferCollection;
    model: OfferDetailsForEditDto;
    initialModel: OfferDetailsForEditDto;
    creditScores: string[];
    section$: Observable<string>;
    offerIsUpdating = false;
    private targetEntity: BehaviorSubject<TargetDirectionEnum> = new BehaviorSubject<TargetDirectionEnum>(TargetDirectionEnum.Current);
    public targetEntity$: Observable<TargetDirectionEnum> = this.targetEntity.asObservable();
    prevButtonIsDisabled = true;
    nextButtonIsDisabled = true;
    sentAnnouncementPermissionGranted: boolean;
    constructor(
        injector: Injector,
        private route: ActivatedRoute,
        private offerAnnouncementService: OfferAnnouncementServiceProxy,
        private offerManagementService: OfferManagementServiceProxy,
        private applicationRef: ApplicationRef,
        private router: Router,
        private store$: Store<RootStore.State>,
        private notifyService: NotifyService,
        private changeDetector: ChangeDetectorRef,
        private itemDetailsService: ItemDetailsService,
        private permissionChecker: AppPermissionService,
        private dialog: MatDialog,
        public ls: AppLocalizationService
    ) {
        this.rootComponent = injector.get(this.applicationRef.componentTypes[0]);
        this.sentAnnouncementPermissionGranted = this.permissionChecker.isGranted(AppPermissions.PFMApplicationsSendOfferAnnouncements);
        this.creditScores = Object.keys(CreditScoreRating);
    }

    ngOnInit() {
        this.offerId$ = this.route.paramMap.pipe(
            map((paramMap: ParamMap) => +paramMap.get('id')),
            distinctUntilChanged()
        );
        this.offerDetails$ = merge(
            this.refresh$,
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
        this.section$ = this.route.paramMap.pipe(map((paramMap: ParamMap) => paramMap.get('section') || 'general'));
        this.states$  = this.offerDetails$.pipe(
            map(offerDetails => offerDetails.countries ? offerDetails.countries[0] : 'US'),
            tap(countryCode => this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode))),
            switchMap(countryCode => this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode})))
        );
        this.categoriesNames$ = this.offerDetails$.pipe(
            pluck('categories'),
            map((categories: OfferCategoryDto[]) => categories.map(category => category.name))
        );
        this.offerNotInCardCategory$ = this.categoriesNames$.pipe(
            map((categoriesNames: any[]) => categoriesNames.every(categoryName => categoryName.indexOf('Credit Cards') === -1))
        );
        this.rootComponent.overflowHidden(true);
        this.offerNotInCardCategory$.subscribe((offerNotInCardCategory: boolean) => {
            const creditCardLinkIndex = this.navLinks.findIndex(link => link.route === '../flags');
            this.navLinks[creditCardLinkIndex]['disabled'] = offerNotInCardCategory;
        });
        this.offerDetails$.subscribe(details => {
            this.model = details;
            this.updateInitialModel();
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
            if (itemFullInfo && offerId !== itemFullInfo.itemData.CampaignId) {
                this.router.navigate(
                    ['../..', itemFullInfo.itemData.CampaignId, section],
                    { relativeTo: this.route }
                );
            }
            this.nextButtonIsDisabled = itemFullInfo && itemFullInfo.isLastOnList;
            this.prevButtonIsDisabled = itemFullInfo && itemFullInfo.isFirstOnList;
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
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.updateInitialModel();
            },
            e => this.notifyService.error(e)
        );
        return submit$;
    }

    private updateInitialModel() {
        this.initialModel = cloneDeep(this.model);
    }

    getOfferTitle() {
        return this.model && (this.model.extendedInfo.customName || this.model.name);
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

    onNotify() {
        if (this.sentAnnouncementPermissionGranted) {
            this.offerId$.pipe(first()).subscribe((offerId: number) => {
                const offerCategory = OffersService.getCategoryRouteNameByCategoryEnum(this.model.categories[0].category as any);
                const offerPublicLink = AppConsts.appBaseUrl + '/personal-finance/offers/' + offerCategory + '/' + offerId;
                this.dialog.open(OfferNotifyDialogComponent, {
                    width: '520px',
                    panelClass: 'offer-announcement-dialog',
                    data: {
                        offerPublicLink: offerPublicLink,
                        offerId: offerId
                    }
                });
            });
        }
    }

    checkSection(uri) {
        return this.section$.pipe(filter(section => section == uri));
    }

    onStatsClick(event) {
        this.router.navigate(['../visitors'],
            { relativeTo: this.route, queryParams: event });
    }
}
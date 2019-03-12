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
import { Observable, Subject } from 'rxjs';
import { finalize, map, tap, publishReplay, pluck, startWith, switchMap, refCount, withLatestFrom } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from 'shared/service-proxies/service-proxies';
import { RootComponent } from 'root.components';
import {
    CountryStateDto,
    CreditScores2,
    ExtendOfferDto,
    OfferDetailsForEditDtoCampaignProviderType,
    OfferDetailsForEditDtoCardNetwork,
    OfferDetailsForEditDtoOfferCollection,
    OfferDetailsForEditDtoSecuringType,
    OfferDetailsForEditDtoStatus, OfferDetailsForEditDtoSystemType,
    OfferDetailsForEditDtoTargetAudience,
    OfferDetailsForEditDtoType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';

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
        map(offerDetails => offerDetails.countries ? offerDetails.countries[0] : 'US'),
        tap(countryCode => this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode))),
        switchMap(countryCode => this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode})))
    );
    offerNotInCardCategory$ = this.offerDetails$.pipe(pluck('categories'), map((categories: any[]) => categories.indexOf('Credit Cards') === -1));
    statusEnum = OfferDetailsForEditDtoStatus;
    systemTypeEnum = OfferDetailsForEditDtoSystemType;
    typeEnum = OfferDetailsForEditDtoType;
    campaignProviderTypeEnum = OfferDetailsForEditDtoCampaignProviderType;
    cardNetworkEnum = OfferDetailsForEditDtoCardNetwork;
    targetAudienceEnum = OfferDetailsForEditDtoTargetAudience;
    securingTypeEnum = OfferDetailsForEditDtoSecuringType;
    creditScoresEnum = CreditScores2;
    offerCollectionEnum = OfferDetailsForEditDtoOfferCollection;
    model: OfferDetailsForEditDto;
    section$: Observable<string>;
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
    }

    refreshData() {
        this._refresh.next();
    }

    keys(obj: Object): string[] {
        return Object.keys(obj);
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

    getInplaceWidth(name: string): string {
        return ((name.length + 1) * 12) + 'px';
    }

    updateCustomName(value: string) {
        this.model.customName = value;
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

/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
    Inject,
    ViewChild,
    ElementRef
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { finalize, first, map, tap } from 'rxjs/operators';
import * as _ from 'underscore';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors, RootStore, StatesStoreSelectors, StatesStoreActions } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import {
    BusinessEntityServiceProxy,
    CreateBusinessEntityDto,
    UpdateBusinessEntityDto,
    BusinessEntityInfoDto,
    BusinessEntityDto,
    BusinessEntityStatus,
    BusinessEntityType,
    CountryStateDto,
    CountryDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CFOService } from '@shared/cfo/cfo.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: 'business-entity-edit-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', 'business-entity-edit-dialog.component.less' ],
    providers: [ BusinessEntityServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessEntityEditDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('addressInput') addressInput: ElementRef;
    businessEntities$: Observable<BusinessEntityDto[]> = this.businessEntityService.getBusinessEntities(this.cfoService.instanceType as any, this.cfoService.instanceId).pipe(
        map((businessEntities: BusinessEntityDto[]) => {
            if (!this.isNew)
                businessEntities = businessEntities.map(item => {
                    item['disabled'] = (item.id === this.data.id)
                        || this.checkParentForbidden(businessEntities, item);
                    return item;
                });
            return businessEntities;
        })
    );
    types: any;
    countries: any;
    masks = AppConsts.masks;
    maxDate = new Date();
    emailRegEx = AppConsts.regexPatterns.email;
    dateFormat = AppConsts.formatting.dateMoment;
    googleAutoComplete = Boolean(window['google']);
    address: any = {
        countryCode: null,
        countryName: null,
        address: null
    };
    isNew = !this.data.id;
    businessEntity: BusinessEntityInfoDto = new BusinessEntityInfoDto();
    title: string = this.isNew
        ? this.ls.l('BusinessEntity_CreateHeader')
        : this.ls.l('BusinessEntity_EditHeader');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('BusinessEntity_Cancel'),
            class: 'default',
            action: () => {
                this.modalDialog.close(true);
            }
        }, {
            title: this.ls.l('BusinessEntity_Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private sessionService: AppSessionService,
        private businessEntityService: BusinessEntityServiceProxy,
        private notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        private cfoService: CFOService,
        private store$: Store<RootStore.State>,
        private statesService: StatesService,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.countriesStateLoad();
        this.loadTypes();
        if (this.isNew) {
            this.businessEntity.isDefault = false;
        } else {
            this.modalDialog.startLoading();
            this.businessEntityService.get(this.cfoService.instanceType as any, this.cfoService.instanceId, this.data.id)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe((result: BusinessEntityInfoDto) => {
                    this.businessEntity = result;
                    Object.keys(this.businessEntity).forEach(key => {
                        let component = this[key + 'Component'];
                        if (component) {
                            component.option('value', this.businessEntity[key]);
                        }
                    });

                    if (this.businessEntity) {
                        let country = _.findWhere(this.countries, { code: this.businessEntity.countryId });
                        this.address['countryCode'] = this.businessEntity.countryId;
                        this.address['countryName'] = country && country.name;
                        this.onCountryChange({ value: this.address['countryName'] });

                        if (this.googleAutoComplete) {
                            this.address['address'] = [
                                this.businessEntity.streetAddress,
                                this.businessEntity.city,
                                this.businessEntity.stateId,
                                this.businessEntity.countryId
                            ].filter(Boolean).join(', ');
                        }
                    }
                    this.changeDetectorRef.detectChanges();
                });
        }
    }

    checkParentForbidden(entities: BusinessEntityDto[], item: BusinessEntityDto) {
        if (!item || !item.parentId)
            return false;
        else if (item.parentId === this.data.id)
            return true;
        else
            return this.checkParentForbidden(entities,
                _.findWhere(entities, {id: item.parentId})
            );
    }

    loadTypes() {
        this.businessEntityService.getTypes(this.cfoService.instanceType as any, this.cfoService.instanceId)
            .subscribe(result => {
                this.types = result;
                this.changeDetectorRef.detectChanges();
            });
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((countries: CountryDto[]) => {
            this.countries = countries;
            this.onCountryChange({ value: this.address['country'] });
            this.changeDetectorRef.detectChanges();
        });
    }

    onCountryChange(event) {
        let countryCode = this.getCountryCode(event.value);
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        }
        this.statesService.updateState(countryCode, this.data.stateId, this.data.stateName);
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, { name: name });
        return country && country.code;
    }

    onKeyUp($event, propName) {
        this.businessEntity[propName] = $event.element.getElementsByTagName('input')[0].value;
    }

    validate() {
        if (!this.businessEntity.name) {
            return this.notifyService.error(this.ls.l('BusinessEntity_NameIsRequired'));
        }

        return true;
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.address.countryCode }),
            tap((states: CountryStateDto[]) => {
                if (states && states.length && this.businessEntity.stateId && !this.businessEntity.stateName) {
                    const state = states.find((state: CountryStateDto) => state.code === this.businessEntity.stateId.replace(/\s/g, ''));
                    this.businessEntity.stateName = state.name;
                }
            }),
            map((states: CountryStateDto[]) => states || [])
        );
    }

    clearState() {
        this.businessEntity.stateId = null;
        this.businessEntity.stateName = null;
    }

    stateChanged(e) {
        if (e.value) {
            this.store$.pipe(
                select(StatesStoreSelectors.getStateCodeFromStateName, {
                    countryCode: this.address.countryCode,
                    stateName: e.value
                }),
                first()
            ).subscribe((stateCode: string) => {
                this.businessEntity.stateId = stateCode;
            });
        }
    }

    onCustomStateCreate(e) {
        this.businessEntity.stateId = null;
        this.businessEntity.stateName = e.text;
        this.statesService.updateState(this.address.countryCode, null, e.text);
        e.customItem = {
            code: null,
            name: e.text
        };
    }

    save() {
        if (this.validate()) {
            this.modalDialog.startLoading();
            this.businessEntity.countryId = this.getCountryCode(this.address.countryName);
            this.businessEntity.stateId = this.statesService.getAdjustedStateCode(
                this.businessEntity.stateId,
                this.businessEntity.stateName
            );
            if (this.googleAutoComplete) {
                this.businessEntity.streetAddress = [
                    this.address['streetNumber'],
                    this.address['street']
                ].filter(val => val).join(' ');
            }

            const request$: Observable<any> = this.isNew
                ? this.businessEntityService.createBusinessEntity(this.cfoService.instanceType as any, this.cfoService.instanceId, CreateBusinessEntityDto.fromJS(this.businessEntity))
                : this.businessEntityService.updateBusinessEntity(this.cfoService.instanceType as any, this.cfoService.instanceId, UpdateBusinessEntityDto.fromJS(this.businessEntity));
            request$.pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe(() => {
                    this.modalDialog.close(true, { update: true });
                });
        }
    }

    isActive() {
        return this.isNew || this.businessEntity.status == BusinessEntityStatus.Active;
    }

    isActiveChanged(value): void {
        this.businessEntity.status = value ? BusinessEntityStatus.Active : BusinessEntityStatus.Inactive;
    }

    optionalValueChanged(event) {
        if (!event.value || !event.value.length) {
            event.component.option('isValid', true);
        }
    }

    onComponentInitialized(event, propName) {
        this[propName + 'Component'] = event.component;
        event.component.option('value', this.businessEntity[propName]);
    }

    emptyValue(propName) {
        let component = this[propName + 'Component'];
        if (component) {
            component.option('value', '');
        }
        this.businessEntity[propName] = null;
        this.changeDetectorRef.detectChanges();
    }

    emptyAddress() {
        this.address['address'] = null;
        this.emptyValue('city');
        this.emptyValue('zip');
        this.emptyAddressValue('countryName');
        this.emptyAddressValue('countryCode');
        this.clearState();
        this.changeDetectorRef.detectChanges();
    }

    emptyAddressValue(propName) {
        this.address[propName] = null;
    }

    onAddressChanged(address: Address) {
        const countryCode = GooglePlaceService.getCountryCode(address.address_components);
        const stateCode = GooglePlaceService.getStateCode(address.address_components);
        const stateName = GooglePlaceService.getStateName(address.address_components);
        this.statesService.updateState(countryCode, stateCode, stateName);
        const countryName = GooglePlaceService.getCountryName(address.address_components);
        this.address.countryName = this.sessionService.getCountryNameByCode(countryCode) || countryName;
        this.businessEntity.zip = GooglePlaceService.getZipCode(address.address_components);
        this.address.street = GooglePlaceService.getStreet(address.address_components);
        this.address.streetNumber = GooglePlaceService.getStreetNumber(address.address_components);
        this.businessEntity.stateId = stateCode;
        this.businessEntity.stateName = stateName;
        this.address.countryCode = countryCode;
        this.businessEntity.city = GooglePlaceService.getCity(address.address_components);
        this.address.address = (this.addressInput.nativeElement.value = this.address.streetNumber
            ? this.address.streetNumber + ' ' + this.address.street
            : this.address.street) || '';
    }
}

/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Inject, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreSelectors, StatesStoreActions } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import {
    BusinessEntityServiceProxy,
    CreateBusinessEntityDto,
    UpdateBusinessEntityDto,
    BusinessEntityInfoDto,
    BusinessEntityDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { CFOService } from '@shared/cfo/cfo.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';

@Component({
    templateUrl: 'business-entity-edit-dialog.component.html',
    styleUrls: [ '../../../shared/common/styles/form.less', 'business-entity-edit-dialog.component.less' ],
    providers: [ BusinessEntityServiceProxy, GooglePlaceHelper ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessEntityEditDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    businessEntities$: Observable<BusinessEntityDto[]>;
    types: any;
    states: any;
    countries: any;
    masks = AppConsts.masks;
    maxDate = new Date();
    emailRegEx = AppConsts.regexPatterns.email;
    dateFormat = AppConsts.formatting.dateMoment;
    googleAutoComplete = Boolean(window['google']);
    address = {
        state: null,
        country: null,
        address: null
    };
    isNew = false;
    businessEntity = new BusinessEntityInfoDto();
    title: string;
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
        private _businessEntityService: BusinessEntityServiceProxy,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _cfoService: CFOService,
        private store$: Store<RootStore.State>,
        private googlePlaceHelper: GooglePlaceHelper,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.isNew = !this.data.id;
        this.title = this.isNew ? this.ls.l('BusinessEntity_CreateHeader') : this.ls.l('BusinessEntity_EditHeader');
    }

    ngOnInit() {
        this.businessEntitiesLoad();
        this.countriesStateLoad();
        this.loadTypes();
        if (this.isNew) {
            this.businessEntity.isDefault = false;
        } else {
            this.modalDialog.startLoading();
            this._businessEntityService.get(this._cfoService.instanceType as any, this._cfoService.instanceId, this.data.id)
                .pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe(result => {
                    this.businessEntity = result;

                    Object.keys(this.businessEntity).forEach(key => {
                        let component = this[key + 'Component'];
                        if (component) {
                            component.option('value', this.businessEntity[key]);
                        }
                    });

                    if (this.businessEntity) {
                        let country = _.findWhere(this.countries, { code: this.businessEntity.countryId });
                        this.address['country'] = country && country.name;
                        this.onCountryChange({ value: this.address['country'] });

                        if (this.googleAutoComplete) {
                            this.address['address'] = [
                                this.businessEntity.streetAddress,
                                this.businessEntity.city,
                                this.businessEntity.stateId,
                                this.businessEntity.countryId
                            ].filter(val => val).join(', ');
                        }
                    }
                    this._changeDetectorRef.detectChanges();
                });
        }
    }

    businessEntitiesLoad() {
        this.businessEntities$ = this._businessEntityService.getBusinessEntities(this._cfoService.instanceType as any, this._cfoService.instanceId).pipe(
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
        this._businessEntityService.getTypes(this._cfoService.instanceType as any, this._cfoService.instanceId)
            .subscribe(result => {
                this.types = result;
                this._changeDetectorRef.detectChanges();
            });
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            if (this.address['country']) {
                this.onCountryChange({ value: this.address['country'] });
            }
            this._changeDetectorRef.detectChanges();
        });
    }

    onCountryChange(event) {
        let countryCode = this.getCountryCode(event.value);
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
            this.store$.pipe(select(StatesStoreSelectors.getState, {
                countryCode: countryCode
            })).subscribe(result => {
                this.states = result;
                if (this.businessEntity.stateId && !this.address['state']) {
                    let state = _.findWhere(this.states, { code: this.businessEntity.stateId });
                    this.address['state'] = state && state.name;
                }
                this._changeDetectorRef.detectChanges();
            });
        }
    }

    getCountryCode(name) {
        let country = _.findWhere(this.countries, { name: name });
        if (country) {
            return country && country.code;
        }
    }

    getStateCode(name) {
        let state = _.findWhere(this.states, { name: name });
        return state && state.code;
    }

    onKeyUp($event, propName) {
        let value = $event.element.getElementsByTagName('input')[0].value;
        this.businessEntity[propName] = value;
    }

    validate() {
        if (!this.businessEntity.name) {
            return this._notifyService.error(this.ls.l('BusinessEntity_NameIsRequired'));
        }

        return true;
    }

    save() {
        if (this.validate()) {
            this.modalDialog.startLoading();
            this.businessEntity.countryId = this.getCountryCode(this.address.country);
            this.businessEntity.stateId = this.getStateCode(this.address.state);

            if (this.googleAutoComplete) {
                this.businessEntity.streetAddress = [
                    this.address['streetNumber'],
                    this.address['street']
                ].filter(val => val).join(' ');
            }

            const request$ = this.isNew
                ? this._businessEntityService.createBusinessEntity(this._cfoService.instanceType as any, this._cfoService.instanceId, CreateBusinessEntityDto.fromJS(this.businessEntity))
                : this._businessEntityService.updateBusinessEntity(this._cfoService.instanceType as any, this._cfoService.instanceId, UpdateBusinessEntityDto.fromJS(this.businessEntity));
            request$.pipe(finalize(() => this.modalDialog.finishLoading()))
                .subscribe(() => {
                    this.modalDialog.close(true, { update: true });
                });
        }
    }

    isActive() {
        return this.isNew || this.businessEntity.statusId == 'A';
    }

    isActiveChanged(value): void {
        this.businessEntity.statusId = value ? 'A' : 'I';
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
        this._changeDetectorRef.detectChanges();
    }

    emptyAddress() {
        this.address['address'] = null;
        this.emptyValue('city');
        this.emptyValue('zip');
        this.emptyAddressValue('country');
        this.emptyAddressValue('state');
        this._changeDetectorRef.detectChanges();
    }

    emptyAddressValue(propName) {
        this.address[propName] = null;
    }

    updateCountryInfo(countryName: string) {
        countryName == 'United States' ?
            this.address.country = AppConsts.defaultCountryName :
            this.address.country = countryName;
        this._changeDetectorRef.detectChanges();
    }

    onAddressChanged(event) {
        this.address.state = this.googlePlaceHelper.getState(event.address_components);
        this.businessEntity.city = this.googlePlaceHelper.getCity(event.address_components);
    }
}

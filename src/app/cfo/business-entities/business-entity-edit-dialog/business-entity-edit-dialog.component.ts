/** Core imports */
import { Component, OnInit, Injector } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreSelectors, StatesStoreActions } from '@root/store';
import { AppConsts } from '@shared/AppConsts';
import { CFOModalDialogComponent } from '@app/cfo/shared/common/dialogs/modal/cfo-modal-dialog.component';
import {
    InstanceType,
    BusinessEntityServiceProxy,
    CreateBusinessEntityDto,
    UpdateBusinessEntityDto,
    BusinessEntityInfoDto,
    CountryServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: 'business-entity-edit-dialog.component.html',
    styleUrls: ['business-entity-edit-dialog.component.less'],
    providers: [ BusinessEntityServiceProxy, CountryServiceProxy ]
})
export class BusinessEntityEditDialogComponent extends CFOModalDialogComponent implements OnInit {

    types: any;
    states: any;
    countries: any;

    masks = AppConsts.masks;
    maxDate = new Date();
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    dateFormat = AppConsts.formatting.date;

    googleAutoComplete = Boolean(window['google']);
    address = {
        state: null,
        country: null,
        address: null
    };

    saving = false;
    isNew = false;
    businessEntity = new BusinessEntityInfoDto();

    constructor(
        injector: Injector,
        private _countryService: CountryServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy,
        private store$: Store<RootStore.State>
    ) {
        super(injector);

        this.isNew = !this.data.id;

        this.countriesStateLoad();
        this.loadTypes();

        if (!this.isNew) {
            this._businessEntityService.get(InstanceType[this.instanceType], this.instanceId, this.data.id)
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
                                this.businessEntity.address,
                                this.businessEntity.city,
                                this.businessEntity.stateId,
                                this.businessEntity.countryId
                            ].filter(val => val).join(', ');
                        }
                    }
                });
        }
    }

    ngOnInit() {
        super.ngOnInit();
        this.initHeader();
    }

    initHeader(): any {
        this.data = Object.assign(this.data, {
            title: this.isNew ? this.l('BusinessEntity_CreateHeader') : this.l('BusinessEntity_EditHeader'),
            editTitle: false,
            buttons: [
                {
                    title: this.l('BusinessEntity_Cancel'),
                    class: 'default',
                    action: () => {
                        this.close(true);
                    }
                }, {
                    title: this.l('BusinessEntity_Save'),
                    class: 'primary',
                    action: this.save.bind(this)
                }
            ]
        });
    }

    loadTypes() {
        this._businessEntityService.getTypes(InstanceType[this.instanceType], this.instanceId)
            .subscribe(result => {
                this.types = result;
            });
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
            if (this.address['country']) {
                this.onCountryChange({ value: this.address['country'] });
            }
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
            return this.notify.error(this.l('BusinessEntity_NameIsRequired'));
        }

        return true;
    }

    save() {
        if (this.validate()) {
            this.saving = true;

            this.businessEntity.countryId = this.getCountryCode(this.address.country);
            this.businessEntity.stateId = this.getStateCode(this.address.state);

            if (this.googleAutoComplete) {
                this.businessEntity.address = [
                    this.address['streetNumber'],
                    this.address['street']
                ].filter(val => val).join(' ');
            }

            if (this.isNew) {
                this._businessEntityService.createBusinessEntity(InstanceType[this.instanceType], this.instanceId, CreateBusinessEntityDto.fromJS(this.businessEntity))
                    .pipe(finalize(() => {
                        this.saving = false;
                    })).subscribe(result => {
                        this.close(true, { update: true });
                    });
            } else {
                this._businessEntityService.updateBusinessEntity(InstanceType[this.instanceType], this.instanceId, UpdateBusinessEntityDto.fromJS(this.businessEntity))
                    .pipe(finalize(() => {
                        this.saving = false;
                    })).subscribe(result => {
                        this.close(true, { update: true });
                    });
            }
        }
    }

    isActive() {
        return this.isNew || this.businessEntity.statusId == 'A';
    }

    isActiveChanged(value) {
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
    }

    emptyAddress() {
        this.address['address'] = null;
        this.emptyValue('city');
        this.emptyValue('zip');
        this.emptyAddressValue('country');
        this.emptyAddressValue('state');
    }

    emptyAddressValue(propName) {
        this.address[propName] = null;
    }
}

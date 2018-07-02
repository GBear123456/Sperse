import { Component, OnInit, Injector } from '@angular/core';
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
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: 'business-entity-edit-dialog.component.html',
    styleUrls: ['business-entity-edit-dialog.component.less'],
    providers: [BusinessEntityServiceProxy, CountryServiceProxy]
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

    googleAutoComplete = false;
    saving = false;
    isNew = false;

    private validationError: string;

    businessEntity = new BusinessEntityInfoDto();

    constructor(
        injector: Injector,
        private _countryService: CountryServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy
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
        this._countryService.getCountries()
            .subscribe(result => {
                this.countries = result;
            });
    }

    onCountryChange(event) {
        let countryCode = event.value;
        if (countryCode) {
            this._countryService
                .getCountryStates(countryCode)
                .subscribe(result => {
                    this.states = result;
                });
        }
    }

    onKeyUp($event, propName) {
        let value = $event.element.getElementsByTagName('input')[0].value;
        console.log('keyUp', this.businessEntity[propName]);
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
}

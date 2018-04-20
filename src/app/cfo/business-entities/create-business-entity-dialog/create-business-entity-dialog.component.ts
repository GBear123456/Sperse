import { Component, OnInit, Injector } from '@angular/core';

import { ContactTypes } from '@shared/AppEnums';
import { AppConsts } from '@shared/AppConsts';

import { CFOModalDialogComponent } from '@app/cfo/shared/common/dialogs/modal/cfo-modal-dialog.component';

import {
    InstanceType,
    BusinessEntityServiceProxy,
    CreateBusinessEntityDto,
    CountryServiceProxy,
    BusinessEntityDto
} from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    templateUrl: 'create-business-entity-dialog.component.html',
    styleUrls: ['create-business-entity-dialog.component.less'],
    providers: [BusinessEntityServiceProxy, CountryServiceProxy]
})
export class CreateBusinessEntityDialogComponent extends CFOModalDialogComponent implements OnInit {

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

    private validationError: string;

    businessEntity = new CreateBusinessEntityDto();

    constructor(
        injector: Injector,
        private _countryService: CountryServiceProxy,
        private _businessEntityService: BusinessEntityServiceProxy
    ) {
        super(injector);

        this.countriesStateLoad();
        this.loadTypes();
    }

    ngOnInit() {
        super.ngOnInit();

        this.initHeader();
    }

    initHeader(): any {
        this.data = Object.assign(this.data, {
            title: this.l('BusinessEntity_CreateHeader'),
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
                    action: () => {
                        if (this.validate()) {
                            this.saving = true;
                            this._businessEntityService.createBusinessEntity(InstanceType[this.instanceType], this.instanceId, this.businessEntity)
                                .finally(() => {
                                    this.saving = false;
                                }).subscribe(result => {
                                    this.close(true, { update: true });
                                });
                        }
                    }
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
        this.businessEntity[propName] = value;
    }

    validate() {
        if (!this.businessEntity.name) {
            return this.notify.error(this.l('BusinessEntity_NameRequired'));
        }

        return true;
    }
}

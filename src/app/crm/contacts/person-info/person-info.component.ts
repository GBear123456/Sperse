import { Component, Inject, Injector, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactServiceProxy, UpdatePersonInfoInput, PersonInfoDto } from 'shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'person-info',
    templateUrl: './person-info.component.html',
    styleUrls: ['./person-info.component.less']
})
export class PersonInfoComponent extends AppComponentBase {
    @Input() data;

    isEditAllowed: boolean = false;
    constructor(
        injector: Injector,
        private _personContactService: PersonContactServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.Manage');
    }

    getPropData(propName){
        return {
            id: this.data.id,
            value: this.data.person[propName],
            validationRules: [],
            lEntityName: propName,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        }
    }

    getFullName(person) {
        return [person.namePrefix, person.firstName, person.middleName, person.lastName, 
            person.nameSuffix && (', ' + person.nameSuffix), person.nickName && ('(' + person.nickName + ')')].filter(Boolean).join(' ');
    }

    updateValue(value, propName){
        value = value.trim();
        let person = this.data.person;
        person[propName] = value;
        if (this.data.id)
            this._personContactService.updatePersonInfo(
                UpdatePersonInfoInput.fromJS(
                    _.extend({id: this.data.id}, person))
            ).subscribe(result => {
                this.data.fullName = result.fullName;
            });
        else
            this.data.fullName = this.getFullName(person);
    }
}
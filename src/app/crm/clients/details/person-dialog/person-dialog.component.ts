import { Component, Inject, Injector, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, PersonContactServiceProxy, UpdatePersonInfoInput, PersonInfoDto } from 'shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'person-dialog',
    templateUrl: './person-dialog.component.html',
    styleUrls: ['./person-dialog.component.less']
})
export class PersonDialogComponent extends AppComponentBase {
    isEditAllowed: boolean = false;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: PersonContactInfoDto,
        public dialog: MatDialog,
        public dialogRef: MatDialogRef<PersonDialogComponent>,
        private _personContactService: PersonContactServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    getPropData(propName){
        return {
            id: this.data.id,
            value: this.data.person[propName],
            validationRules: [],
            lEntityName: propName,
            lEditPlaceholder: 'Enter value'        
        }
    }

    updateValue(value, propName){
        value = value.trim();
        let person = this.data.person;
        person[propName] = value;
        this._personContactService.updatePersonInfo(
            UpdatePersonInfoInput.fromJS(
                _.extend({id: this.data.id}, person))
        ).subscribe(result => {
            this.data.fullName = result.fullName;
        });
    }
}
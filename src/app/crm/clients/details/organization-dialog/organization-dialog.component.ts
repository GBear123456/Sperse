import { Component, Inject, Injector, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { InplaceEditModel } from 'app/shared/common/inplace-edit/inplace-edit.model';
import { OrganizationContactInfoDto } from 'shared/service-proxies/service-proxies';

import * as moment from 'moment';

@Component({
    selector: 'organization-dialog',
    templateUrl: './organization-dialog.component.html',
    styleUrls: ['./organization-dialog.component.less'],
})
export class OrganizationDialogComponent extends AppComponentBase {
    isEditAllowed: boolean = false;

    org = {
        logo_big: '../../../../../assets/common/images/app-logo-on-light.png',
    };

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: OrganizationContactInfoDto,
        public dialogRef: MatDialogRef<OrganizationDialogComponent>,
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        
        this.isEditAllowed = this.isGranted('Pages.CRM.Customers.ManageContacts');
    }

    updateValue(event, fieldName) {
        alert(event.target);
    }

    getPropData(value, fieldName, label) {
        var propData = {
            id: this.data.id,
            value: value,
            validationRules: [],
            isEditDialogEnabled: false,
            lEntityName: fieldName
        } as InplaceEditModel;
        return propData;
    }

    getDatePropData(value: moment.Moment, fieldName, label) {
        var dateS = value.format('MMM YYYY');
        return this.getPropData(dateS, fieldName, label);
    }
}
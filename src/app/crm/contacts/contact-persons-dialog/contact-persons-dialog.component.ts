import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, ContactGroupInfoDto } from 'shared/service-proxies/service-proxies';

import * as _ from 'underscore';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
})
export class ContactPersonsDialogComponent extends AppComponentBase {

    contactPersonsFiltered: PersonContactInfoDto[];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: ContactGroupInfoDto,
        public dialogRef: MatDialogRef<ContactPersonsDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.contactPersonsFiltered = this.data.contactPersons.filter(item => item.id != this.data.primaryContactInfo.id);
    }

    selectContactPerson(contactPerson): void {
        this.data.primaryContactInfo = contactPerson;
        this.dialogRef.close();
    }
}

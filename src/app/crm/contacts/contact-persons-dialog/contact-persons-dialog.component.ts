import { Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, ContactGroupInfoDto } from 'shared/service-proxies/service-proxies';

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

    addNewContact() {
        this.dialogRef.close('addNewContact');
    }

    filterList(event) {
        let filter, ul, li, element;
        filter = event.target.value.toUpperCase();
        ul = document.getElementById('related-contact-list');
        li = ul.getElementsByTagName('li');

        for (let i = 0; i < li.length; i++) {
            element = li[i].querySelector('.full-name h1');
            if (element.innerHTML.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = '';
            } else {
                li[i].style.display = 'none';
            }
        }
    }
}

import { Component, Inject, Injector } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, CustomerInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
})
export class ContactPersonsDialogComponent extends AppComponentBase {

    contactPersonsFiltered: PersonContactInfoDto[];

    person = {
        id: 1,
        first_name: 'Matthew',
        second_name: 'Robertson',
        rating: 7,
        person_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        approved_sum: '45000',
        requested_sum_min: '100000',
        requested_sum_max: '245000',
        profile_created: '6/6/2016',
        lead_owner_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        lead_owner_name: 'R.Hibbert',
        org_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png'
    };

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: CustomerInfoDto,
        public dialogRef: MatDialogRef<ContactPersonsDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.contactPersonsFiltered = this.data.contactPersons.filter(item => item.id != this.data.primaryContactInfo.id);
    }

    selectContactPerson(contactPerson): void {
        this.data.name = contactPerson.fullName;

        let primaryContactInfo = this.data.primaryContactInfo;
        primaryContactInfo.id = contactPerson.id;
        primaryContactInfo.primaryPhoto = contactPerson.photo;

        let primaryContactDetails = primaryContactInfo.details;
        let contactPersonDetails = contactPerson.details;
        primaryContactDetails.contactId = contactPerson.id;
        primaryContactDetails.emails = contactPersonDetails.emails;
        primaryContactDetails.phones = contactPersonDetails.phones;
        primaryContactDetails.addresses = contactPersonDetails.addresses;
        primaryContactDetails.links = contactPersonDetails.links;

        this.dialogRef.close();
    }
}

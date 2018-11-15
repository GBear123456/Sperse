import { ChangeDetectionStrategy, Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonContactInfoDto, ContactInfoDto } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPersonsDialogComponent extends AppComponentBase {

    contactPersons: PersonContactInfoDto[];
    displayedContactPersons: PersonContactInfoDto[];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
        public dialogRef: MatDialogRef<ContactPersonsDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.displayedContactPersons = this.contactPersons = this.data.contactPersons.filter(item => item.id != this.data.personContactInfo.id);
    }

    selectContactPerson(contactPerson): void {
        this.data.personContactInfo = contactPerson;
        this.dialogRef.close();
    }

    addNewContact() {
        this.dialogRef.close('addNewContact');
    }

    filterList(event) {
        let filter = event.target.value.toUpperCase();
        this.displayedContactPersons = this.contactPersons.filter(person => person.fullName.toUpperCase().indexOf(filter) > -1);
    }
}

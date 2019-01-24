import { ChangeDetectionStrategy, Component, Inject, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonShortInfoDto, ContactInfoDto, ContactServiceProxy } from 'shared/service-proxies/service-proxies';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPersonsDialogComponent extends AppComponentBase {

    displayedPersons: PersonShortInfoDto[];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: ContactInfoDto,
        private _contactService: ContactServiceProxy,
        public dialogRef: MatDialogRef<ContactPersonsDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.filterList();
    }

    selectContactPerson(contactPerson): void {
        this.startLoading(true);
        this._contactService.getContactInfo(contactPerson.id)
            .pipe(finalize(() => this.finishLoading(true))).subscribe((contactInfo) => {
                contactInfo['organizationContactInfo'] = this.data['organizationContactInfo'];
                this.dialogRef.close(contactInfo);
            });
    }

    addNewContact() {
        this.dialogRef.close('addNewContact');
    }

    filterList(event?) {
        let search = event ? event.target.value.toUpperCase() : '';
        this.displayedPersons = this.data['organizationContactInfo'].contactPersons.filter((person) => {
            return (person.id != this.data.personContactInfo.id)
                && (!search || person.fullName.toUpperCase().indexOf(search) > -1);
        });
    }
}

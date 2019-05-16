import { ChangeDetectionStrategy, Component, Inject, Injector, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPersonsDialogComponent extends AppComponentBase {
    @ViewChild(ContactListDialogComponent) contactList: ContactListDialogComponent;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ContactPersonsDialogComponent>
    ) {
        super(injector);
    }

    ngOnInit() {
        this.contactList.filter = (search?) => {
            return this.data['organizationContactInfo'].contactPersons.filter((person) => {
                return (person.id != this.data.personContactInfo.id)
                    && (!search || person.fullName.toLowerCase().indexOf(search) > -1);
            });
        };
        this.contactList.filterList();
    }
}

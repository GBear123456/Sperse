import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPersonsDialogComponent implements OnInit {
    @ViewChild(ContactListDialogComponent) contactList: ContactListDialogComponent;

    constructor(
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

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

import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonShortInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'contact-persons-dialog',
    templateUrl: './contact-persons-dialog.component.html',
    styleUrls: ['./contact-persons-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPersonsDialogComponent {
    @ViewChild(ContactListDialogComponent, { static: true }) contactList: ContactListDialogComponent;
    displayItems: PersonShortInfoDto[] = this.search();
    constructor(
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    search(search?: string) {
        this.displayItems = this.data['organizationContactInfo'].contactPersons.filter((person: PersonShortInfoDto) => {
            return (person.id != this.data.personContactInfo.id)
                && (!search || person.fullName.toLowerCase().indexOf(search) > -1);
        });
        return this.displayItems;
    }
}

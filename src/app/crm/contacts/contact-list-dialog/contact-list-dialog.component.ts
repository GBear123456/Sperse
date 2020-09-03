import { ChangeDetectionStrategy, Component, Inject, TemplateRef, ContentChild, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'contact-list-dialog',
    templateUrl: './contact-list-dialog.component.html',
    styleUrls: ['./contact-list-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactListDialogComponent {
    @ContentChild(TemplateRef, { static: false })
    @Input() contactLayoutTemplate: TemplateRef<any> = this.data.contactLayoutTemplate;
    @Input()title = this.ls.l('RelatedContacts');
    displayList: any[] = this.data && this.data.contactList || [];
    addNewTitle = this.ls.l('AddRelatedContact');
    manageAllowed = false;
    photoType;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public profileService: ProfileService,
        public dialogRef: MatDialogRef<ContactListDialogComponent>,
        public ls: AppLocalizationService
    ) {}

    selectContact(contact): void {
        this.dialogRef.close(contact);
    }

    addNewContact() {
        this.dialogRef.close('addContact');
    }

    filterList(event?) {
        this.displayList = this.filter(event && event.target.value.toLowerCase() || '');
    }

    filter(search?) {
        return [];
    }
}

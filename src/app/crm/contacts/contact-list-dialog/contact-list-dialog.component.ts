import { ChangeDetectionStrategy, Component, Inject, TemplateRef, ContentChild, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'contact-list-dialog',
    templateUrl: './contact-list-dialog.component.html',
    styleUrls: ['./contact-list-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactListDialogComponent {
    displayList: any[];
    title = this.ls.l('RelatedContacts');
    addNewTitle = this.ls.l('AddRelatedContact');
    manageAllowed = false;
    photoType;

    @ContentChild(TemplateRef)
    @Input() contactLayoutTemplate: TemplateRef<any>;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
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

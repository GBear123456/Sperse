import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    TemplateRef,
    ContentChild,
    Input,
    Output,
    EventEmitter
} from '@angular/core';
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
    @ContentChild(TemplateRef) contactLayoutTemplate: TemplateRef<any>;
    @Input() title = this.ls.l('RelatedContacts');
    @Input() displayList: any[];
    @Input() addNewTitle = this.ls.l('AddRelatedContact');
    @Input() photoType: string;
    @Input() manageAllowed = false;
    @Output() onSearch: EventEmitter<string> = new EventEmitter<string>();

    constructor(
        public profileService: ProfileService,
        public dialogRef: MatDialogRef<ContactListDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    selectContact(contact): void {
        this.dialogRef.close(contact);
    }

    addNewContact() {
        this.dialogRef.close('addContact');
    }

    search(event?) {
        this.onSearch.emit(event && event.target.value.toLowerCase() || '')
    }

    getPhotoSrc(contact): string {
        return contact.photoPublicId
                ? this.profileService.getContactPhotoUrl(contact.photoPublicId)
                : this.profileService.getPhoto(contact.thumbnail, this.photoType);
    }

    close() {
        this.dialogRef.close();
    }
}

import { ChangeDetectionStrategy, Component, Inject, Injector, TemplateRef, ContentChild, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'contact-list-dialog',
    templateUrl: './contact-list-dialog.component.html',
    styleUrls: ['./contact-list-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactListDialogComponent extends AppComponentBase {
    displayList: any[];
    title = this.l('RelatedContacts');
    addNewTitle = this.l('AddRelatedContact');
    photoType;

    @ContentChild(TemplateRef)
    @Input() contactLayoutTemplate: TemplateRef<any>;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ContactListDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

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
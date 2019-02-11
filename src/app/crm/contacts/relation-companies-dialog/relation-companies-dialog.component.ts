import { ChangeDetectionStrategy, Component, Inject, Injector, ViewChild, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonOrgRelationShortInfo, ContactInfoDto } from 'shared/service-proxies/service-proxies';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';

@Component({
    selector: 'relation-companies-dialog',
    templateUrl: './relation-companies-dialog.component.html',
    styleUrls: ['./relation-companies-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationCompaniesDialogComponent extends AppComponentBase implements OnInit { 
    @ViewChild(ContactListDialogComponent) contactList: ContactListDialogComponent;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ContactListDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.contactList.title = this.l('Related Companies');
        this.contactList.addNewTitle = this.l('Add Contact');
        this.contactList.photoType = 'Organization';
      
        this.contactList.filter = (search?) => {
            return this.data.personContactInfo.orgRelations.map((item) => {
                let contact = item.organization;
                contact['relation'] = item;
                return (contact.id != this.data['organizationContactInfo'].id)
                    && (contact.name.toLowerCase().indexOf(search) >= 0) ? contact: null;
            }).filter(Boolean);
        };

        this.contactList.filterList();
    }

    setPrimary(contact) {
    }
}
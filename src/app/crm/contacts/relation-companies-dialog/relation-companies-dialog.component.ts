import { ChangeDetectionStrategy, Component, Inject, Injector, ViewChild, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { PersonOrgRelationServiceProxy, PersonOrgRelationShortInfo, ContactInfoDto } from 'shared/service-proxies/service-proxies';
import { ContactListDialogComponent } from '../contact-list-dialog/contact-list-dialog.component';

import * as _ from 'underscore';

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
        public dialogRef: MatDialogRef<ContactListDialogComponent>,
        private _relationsServiceProxy: PersonOrgRelationServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.contactList.title = this.l('Related Companies');
        this.contactList.addNewTitle = this.l('Add Contact');
        this.contactList.photoType = 'Organization';
        this.contactList.data = this.data;
      
        this.contactList.filter = (search?) => {
            return this.data.personContactInfo.orgRelations.map((item) => {
                let contact = item.organization;
                contact['relation'] = item;
                return (contact.id != this.data['organizationContactInfo'].id)
                    && (contact.name.toLowerCase().indexOf(search) >= 0) ? contact: null;
            }).filter(Boolean).sort((item) => (item.id == this.data.primaryOrganizationContactId ? -1: 1));
        };

        this.contactList.filterList();
    }

    setPrimary(event, contact) {
        this._relationsServiceProxy.setPrimaryOrgRelation(contact.relation.id).subscribe(() => {
            let orgRelations = this.data.personContactInfo.orgRelations;
            let orgRelation = _.find(orgRelations, orgRelation => orgRelation.isPrimary);
            orgRelation.isPrimary = false;
            orgRelation = _.find(orgRelations, orgRelation => orgRelation.id === contact.relation.id);
            orgRelation.isPrimary = true;
            this.data.primaryOrganizationContactId = contact.id;
            this.notify.info(this.l('SavedSuccessfully'));
            this.dialogRef.close(contact);
        }, (e) => { this.notify.error(e); });
        event.stopPropagation();
    }
}